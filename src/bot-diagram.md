# Bot State Diagram

```mermaid
stateDiagram-v2
    idle --> welcome
    welcome --> menu
    menu --> welcome
    menu --> idle
```
