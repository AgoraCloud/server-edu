# AgoraCloud Helm Chart

# Prerequisites

1. Kubernetes
2. Helm (version 3+)

# Install AgoraCloud

1. Clone this repository
```bash
git clone https://github.com/AgoraCloud/server.git
```

2. Cd into the helm-chart directory
```bash
cd server/helm-chart
```

3. Modify the Helm chart values
```bash
nano values.yaml
```

4. Create and label the AgoraCloud namespace
```bash
kubectl create namespace agoracloud && kubectl label namespace agoracloud app=agoracloud
```

5. Install the AgoraCloud Helm chart
```bash
helm install agoracloud . --namespace agoracloud
```

# Uninstall AgoraCloud

```bash
helm uninstall agoracloud --namespace agoracloud
```