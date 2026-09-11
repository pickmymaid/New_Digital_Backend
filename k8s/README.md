# Deploying to DigitalOcean Kubernetes (DOKS)

**Status: live.** `api.backendpickmymaid.site` DNS already points at this
cluster's ingress load balancer and is serving real traffic — the droplet
that used to run the `server/` monolith has been decommissioned and its
deploy files removed from this repo. The steps below are how the stack
was built and how to rebuild/extend it, not a pending checklist.

## 1. Provision the cluster + registry

```
chmod +x cluster-create.sh
./cluster-create.sh
```

Review the script first — it creates billable DigitalOcean resources.
The node pool runs with `min-nodes=2, max-nodes=4` autoscaling — check
current node count with `kubectl get nodes` / `doctl kubernetes cluster
node-pool get <cluster-id> worker-pool`. If it's ever sitting below
`min-nodes` (autoscale-down-to-min isn't automatically self-healing on
DOKS), restore it with:
```
doctl kubernetes cluster node-pool update <cluster-id> worker-pool --count 2 --auto-scale --min-nodes 2 --max-nodes 4
```

## 2. Cluster add-ons (installed)

```
helm repo add jetstack https://charts.jetstack.io
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace --set installCRDs=true

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

Also required for `k8s/04-hpa.yaml` to actually work — DOKS does not
ship this by default:
```
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```
Verify with `kubectl top nodes` / `kubectl get hpa -n pickmymaid` — the
HPA should show a real `cpu: N%/70%`, not `<unknown>/70%`.

## 3. Build and push the 2 images

Handled by `.github/workflows/deploy-k8s.yml` on every push to `main`
that touches `Backend1/`, `Backend2/`, or `k8s/` — it tests, builds, and
deploys only the backend(s) that changed. To force both regardless of
what changed, run it manually from the Actions tab with `force_all:
true`. Manual build (rarely needed):
```
doctl registry login
for svc in Backend1 Backend2; do
  name=$(echo "$svc" | tr '[:upper:]' '[:lower:]')
  docker build -t registry.digitalocean.com/pickmymaid/$name:latest ../$svc
  docker push registry.digitalocean.com/pickmymaid/$name:latest
done
```

## 4. Secrets

Applied automatically by `deploy-k8s.yml` from this repo's GitHub Actions
secrets (never written to a file in the repo). To do it by hand instead:
```
cp 02-secret.example.yaml 02-secret.yaml
# edit 02-secret.yaml with real values
echo "k8s/02-secret.yaml" >> ../.gitignore
kubectl apply -f 02-secret.yaml
```

## 5. Manifests

```
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 03-cluster-issuer.yaml
kubectl apply -f backend1.yaml
kubectl apply -f backend2.yaml
kubectl apply -f 04-hpa.yaml
kubectl apply -f 05-backend2-cronjob.yaml
kubectl apply -f ingress.yaml
```

## 6. Verify

```
kubectl get pods -n pickmymaid
kubectl get hpa -n pickmymaid
kubectl logs -n pickmymaid -l app=backend2
curl -X POST https://api.backendpickmymaid.site/api/v1/auth/customer/login   # expect a 400 validation error, not a connection failure
```

There's no `/health` route exposed through the ingress (`k8s/ingress.yaml`
only routes specific `/api/v1/...` prefixes) — use the readiness probe's
own `/health` path via `kubectl logs`/`exec`, or hit a real API path and
confirm you get a structured JSON error rather than a timeout.

