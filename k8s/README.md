# Deploying to DigitalOcean Kubernetes (DOKS)

Nothing here has been run yet. This is the order to follow when you're
ready — each step is a deliberate, reviewable action, not a script that
does everything at once.

## 1. Provision the cluster + registry

```
chmod +x cluster-create.sh
./cluster-create.sh
```

Review the script first — it creates billable DigitalOcean resources
(a 3-node DOKS cluster, autoscaling 2-6, plus a container registry).

## 2. Install cluster add-ons

```
helm repo add jetstack https://charts.jetstack.io
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace --set installCRDs=true

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

Wait for the load balancer to get an external IP:
```
kubectl get svc -n ingress-nginx ingress-nginx-controller
```
Point `api.backendpickmymaid.site`'s DNS A record at that IP (this
replaces the existing droplet's A record — only do this once you've
verified the new stack actually works, see step 6).

## 3. Build and push the 2 images

```
doctl registry login
for svc in Backend1 Backend2; do
  name=$(echo "$svc" | tr '[:upper:]' '[:lower:]')
  docker build -t registry.digitalocean.com/pickmymaid/$name:latest ../$svc
  docker push registry.digitalocean.com/pickmymaid/$name:latest
done
```

(Or trigger `.github/workflows/deploy-k8s.yml` manually instead — it does
the same thing, gated behind `workflow_dispatch` so it never runs on its
own.)

## 4. Fill in and apply secrets

```
cp 02-secret.example.yaml 02-secret.yaml
# edit 02-secret.yaml with real values
echo "k8s/02-secret.yaml" >> ../.gitignore
```

## 5. Apply everything

```
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secret.yaml
kubectl apply -f 03-cluster-issuer.yaml
kubectl apply -f backend1.yaml
kubectl apply -f backend2.yaml
kubectl apply -f 04-hpa.yaml
kubectl apply -f ingress.yaml
```

## 6. Verify before cutting over DNS

```
kubectl get pods -n pickmymaid
kubectl logs -n pickmymaid -l app=backend2
curl https://api.backendpickmymaid.site/health   # once DNS is pointed here
```

Test each service's `/health` and a couple of real endpoints (same way
the JS-conversion work in this session verified the monolith) before
relying on this for real traffic. The droplet running `server/` keeps
serving production until you deliberately repoint DNS in step 2 — there's
no automatic cutover.
