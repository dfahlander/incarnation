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
[-] Fina felmeddelanden om man från root anropar metoder som returnerar annat än undefined.

     - Standalone: Glömt inkludera "incarnation-react"?
     - Från events men har inkluderat "incarnation-react"?

[-] Fina felmeddelanden om man anropar muterande metoder från render.
[-] Hantera fallet då man inkluderar "incarnation-react" men inte har `<Observe>`. Cache-timeout default oändlig?
[X] Testa bygga en app i react som använder DataStore och react-incarnation
[ ] Lös bugg: Om mutate() tar tid och man köar upp flera mutationer, så hamnar den i evig loop.

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

# Optimization

[ ] Now, any mutation will rerender any query. Filter that so that only if the reducedResult of a give
query was changed, signal the query's signal. Don't add the queue's signal directly. Subscribe to it from ActiveQuery and signal own signal if reducedResult differs.

# Questions

[ ] Suspendify imperative action: If mutations are enqueued, we now flush them before getting result back. Should we do it differenly?
[ ] We had to remove the call to refresh() when reducedResult() was "invalid". Otherwise we could end up in an infinite loop - as it would trigger notifications and then rerender and then again notification and so on. Why did we call refresh from there initially? Have we caused another bug? Should we compute the reduced result directly after mutate instead and refresh there?

# Rearchitecture:

[V] Rename Topic to Signal
[ ] Change how OptimisticUpdater and MutationMerger are resolved. Let them be props of the abstract class
so that callers dont need to add a set of providers once a store is used.
[ ] Make Context live on globalThis
[ ] Optimize or Marry CurrentExecution, currentAction and Context. Maybe stay separate, as the latter follows instances but the formers vary among each call, but offer a way to runInContext() and provide the CurrentExecution.
