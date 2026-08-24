#!/usr/bin/env bash
# Provisions the DOKS cluster and DOCR registry these manifests target.
# NOT run automatically by anything — review it, then run it yourself when
# you're ready to actually provision (this costs money the moment it runs:
# a 1-node DOKS cluster + registry bill hourly from creation).
#
# 2 nodes, autoscaling 2-4 — node-level resilience (a single node failure
# doesn't take the cluster down) while capping cost below the original
# 3-node/max-6 spec.
set -euo pipefail

CLUSTER_NAME="pickmymaid-cluster"
REGION="blr1" # match the region your MongoDB/droplet already lives in
NODE_SIZE="s-2vcpu-4gb"
NODE_COUNT=2
REGISTRY_NAME="pickmymaid"

echo "Creating DOCR container registry '$REGISTRY_NAME'..."
doctl registry create "$REGISTRY_NAME" --subscription-tier basic || echo "(registry may already exist, continuing)"

echo "Creating DOKS cluster '$CLUSTER_NAME' in $REGION..."
doctl kubernetes cluster create "$CLUSTER_NAME" \
  --region "$REGION" \
  --node-pool "name=worker-pool;size=$NODE_SIZE;count=$NODE_COUNT;auto-scale=true;min-nodes=2;max-nodes=4" \
  --version latest

echo "Configuring kubectl context..."
doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME"

echo "Wiring the cluster to read from the registry..."
doctl kubernetes cluster registry add "$CLUSTER_NAME"

echo "Done. Next: install cert-manager and ingress-nginx (see ARCHITECTURE.md / ingress.yaml comments), then follow k8s/README.md."
