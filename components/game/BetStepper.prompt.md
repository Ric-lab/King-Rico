The bet rail — minus, value, plus — always directly above the spin button, never elsewhere.

```jsx
<BetStepper value="1.000" onDecrease={dec} onIncrease={inc} disabled={spinning} min={bet === 100} />
```

Disable both steppers during a spin rather than hiding them, so the rail never reflows.
