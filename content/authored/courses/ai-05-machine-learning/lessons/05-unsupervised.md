---
id: ai-05-machine-learning.l05
title: Unsupervised learning
summary: k-means and choosing k, DBSCAN, hierarchical clustering, PCA for compression and visualisation, and anomaly detection.
objectives:
  - Cluster data with k-means and evaluate the result
  - Reduce dimensions with PCA and read explained variance
  - Detect anomalies with Isolation Forest
estimatedMinutes: 50
topics: [ai05.unsupervised]
resources:
  - { title: "scikit-learn: Clustering", url: "https://scikit-learn.org/stable/modules/clustering.html", free: true, official: true }
  - { title: "scikit-learn: Decomposing signals in components (PCA)", url: "https://scikit-learn.org/stable/modules/decomposition.html", free: true, official: true }
  - { title: "scikit-learn: Novelty and outlier detection", url: "https://scikit-learn.org/stable/modules/outlier_detection.html", free: true, official: true }
---

Unsupervised learning finds structure without labels: groups, directions of variation and unusual points.

## k-means

1. Pick k centres.
2. Assign every point to its nearest centre.
3. Move each centre to the mean of its points.
4. Repeat until assignments stop changing.

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
X_scaled = StandardScaler().fit_transform(X)
km = KMeans(n_clusters=4, n_init="auto", random_state=0).fit(X_scaled)
km.labels_, km.cluster_centers_, km.inertia_
```

- **Scale** first: k-means uses Euclidean distance.
- It assumes roughly round, similarly sized clusters, and every point is forced into some cluster.
- Choose k with the **elbow** of inertia (within-cluster squared distance) against k, and the **silhouette score**
  (−1 to 1; higher means tighter, better-separated clusters), then check that the clusters make sense to a person.

## Other clustering methods

| Method | Strengths | Watch out |
|---|---|---|
| DBSCAN | Finds arbitrary shapes, marks noise points, no k needed | Sensitive to `eps`; struggles with varying densities |
| Agglomerative (hierarchical) | Dendrogram shows structure at every level | Slow on large data |
| Gaussian mixture | Soft (probabilistic) assignments, elliptical clusters | Assumes Gaussian clusters |

## PCA: principal component analysis

PCA finds new axes (principal components) ordered by how much variance they capture. Keeping the first few:

- **compresses** data and removes noise,
- lets you **plot** high-dimensional data in 2-D,
- speeds up other models.

```python
from sklearn.decomposition import PCA
pca = PCA(n_components=0.95)            # keep enough components for 95% of the variance
Z = pca.fit_transform(X_scaled)
pca.explained_variance_ratio_
```

Components are combinations of the original features, so they are harder to interpret. For visualising clusters,
t-SNE and UMAP preserve local neighbourhoods better, but their distances and cluster sizes are not meaningful.

## Anomaly detection

```python
from sklearn.ensemble import IsolationForest
iso = IsolationForest(contamination=0.01, random_state=0).fit(X_train)
iso.predict(X_new)       # 1 = normal, -1 = anomaly
```

Isolation Forest isolates points with random splits; anomalies need fewer splits. It is a common starting point for
fraud and intrusion detection (see the Cybersecurity roadmap), where labelled attacks are rare.
