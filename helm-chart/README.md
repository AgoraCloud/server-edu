# AgoraCloud Helm Chart

# Prerequisites

1. Docker
2. Kubernetes

# Installation

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

4. Install the AgoraCloud Helm chart
> The Helm chart will create the namespace
```bash
helm install agoracloud . --namespace agoracloud
```

# Uninstallation

```bash
helm uninstall agoracloud --namespace agoracloud
```