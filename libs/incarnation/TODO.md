# Dependency injection

[X] Stöd abstrakta klasser: Kräver äkta proxy.
[X] Gör om så att createProxy skapar en riktig proxy istället.
[X] Hantera Middleware mot abstrakt klass
[X] Optimera runInContext() -> bindToContext()

# React integration

[ ] Läs på hur man testar reactkomponenter med jest - ändrat output givet viss action.
[X] incarnation-react
[X] Hantera fallet då man inte har `<Incarnation>`.
[X] Integrera contexten i Incarnation och React.
[ ] Fina felmeddelanden om man från root anropar metoder som returnerar annat än undefined.

     - Standalone: Glömt inkludera "incarnation-react"?
     - Från events men har inkluderat "incarnation-react"?

[ ] Fina felmeddelanden om man anropar muterande metoder från render.
[ ] Hantera fallet då man inkluderar "incarnation-react" men inte har `<Observe>`. Cache-timeout default oändlig?
[ ] Testa bygga en app i react som använder DataStore och react-incarnation

# Observables

[X] DataStore
[X] context.queries
[X] use()
[X] QueryReducer
[X] Test suspense version of DataStore
[X] Make use() be treated as imperative if called from included service.
[ ] Correct typings for mutate in suspense version of DataStore.
[ ] Test reactive use of DataStore through react integration.
[ ] MutationMerger

# Rearchitecture:

[ ] Rename Topic to Signal
[ ] Make Context live on globalThis
[ ] Optimize or Marry CurrentExecution and Context.
