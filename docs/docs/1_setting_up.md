---
sidebar_label: 'Setting up'
sidebar_position: 1
---

# Setting up

#### Olik is designed to be framework-agnostic, however wrapper libs exist for a growing number of frameworks.

---

If you're **not using a framework**:

```bash
npm install olik
```

---

If you're using **React**:

```bash
npm install olik olik-react
```

---

If you're using **Angular**:

```bash
npm install olik olik-ng
```
```ts
import { OlikNgModule } from 'olik-ng'

@NgModule({ imports: [OlikNgModule] })
```