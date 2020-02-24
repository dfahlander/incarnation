- Testa skapa en effect ad-hoc genom att skapa följande på updateQueue:
  ```js
  {
    "updateQueue": {
      "lastEffect": {
        "tag": 5,
        "create": ()=>{console.log("in effect"); return ()=>console.log("cleanup effect")},
        "destroy": undefined,
        "deps": null,
        "next": existingEffectOrSelf
      }
    },
    "effectTag": existingTag | 516 // Göra detta eller inte?
  }
  ```
- Få det att funka.
- Workaround för äldre reacts? Sätta propen med defineProperty get(){värdet}, set(value) {merga in värdet i value och sätt}
- Debugga setState() Vad andropas för att forcera en rendrering av en komponent. Hoppas vi kan använda det istället för att gå omvägen via context och observedBits.
