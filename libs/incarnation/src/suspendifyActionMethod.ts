import { suspendifyMethodOrGetter } from "./suspendify";

//export let actionPointer = 0;
//export let actionLog: null | any[] = null;
let currentAction: null | ActionState = null;
interface ActionState {
  pointer: number;
  results: any[];
}

// Should use this method always instead of suspendifyMethodOrGetter for functions.
export function suspendifyActionMethod(fn: (...args: any[]) => any) {
  const method = suspendifyMethodOrGetter(fn);
  function action() {
    // TODO: check if actionLog is not null. If null, just return method.apply(this. arguments).
    // Else, check against action log instead.
  }
  return action;
}

/*
  Use case: På förhand känd action. Eller: Vi kommer från rot-state, inte från react render!
  1. Proxyn som binder context, reagerar på om callern kom från rot (gäller suspense).
     I så fall skapas en ActionState och tilldelas currentAction samt att inre anrop görs i en try..catch.
  2. Anropa suspensified method i sin try...catch.
  3. Metoden anropar en annan used metod (tex en DataStore.readSomething())

  A ej cachad readSomething():
  ----------------------------
  4. Den andra metoden kastar Promise.
  5. catch()--> vänta på promiset, behåll currentAction i closure.
     (finally--> återställ currentAction.)
     returnera void. Men om exception sker (ej suspend), kasta vidare.
  6. Promiset resolvar i suspendifyern. Eftersom metoden inte är DataStore.mutate() så uppdateras
     query cache som vanligt. Men eftersom vi var i currentAction så även: Pusha resultatet till action.results.
  7. catch()<-- promiset resolvar:
     Sätt dess pointer = 0.
     Sätt global currentAction från closure's action. Anropa igen. 
  8. När den andra metoden (DataStore.readSomething()) ska anropas så svaras istället direkt med
     resultatet från results och pointer ++.

  B cachad readSomething():
  -------------------------
  4. Den andra metodens suspendifier hittar svar i cache.
  5-8. Eftersom vi har en currentAction så pushas cachens svar till results och pointer++.
       Detta utförs av den suspendifierns proxy.

  Forts från både A och B:
  ------------------------
  9. Den första metoden kallar sedan på en mutate() (en used mutate - suspense-varianten alltså).
  10. mutate() kräver att currentAction existerar, annars ballar den ur (i suspense-läge).
  11. mutate() kollar om pointer < results.length: Om så, ++pointer och returnera undefined.
      Annars, skicka på mutationerna på kön, pusha undefined, ++pointer och returnera undefined.

  12. Den första metoden kallar på en reader igen som suspendar.
  13. Hela suspense-proceduren körs.

  14. När vi kommer tillbaka från readern så sker en mutate igen.
      Här som förut, kolla om pointer < results.length för att avgöra om mutationerna ska läggas på.
  
  
  Async mutate
  ============
  Use case:
    * En service DataPlay har async metod playaround() som gör följande:
       1. Läser från DataStore asynk.
       2. Muterar asynk.
    * Vi hämtar en suspendified version av DataPlay (use(DataPlay)).

  1. Proxyn som binder context, reagerar på om callern kom från rot.
     I så fall skapas en ActionState och tilldelas currentAction samt att inre anrop görs i en try..catch.
  2. Metoden utför hela actionet asynkront och returnerar slutligt promise:
      1. read from dataStore
      2. mutate dataStore.
      3. Use result from mutate to call another mutate.
  3. Eftersom vi kommer från rot returnerar vi void. Vi kastar inte något Promise ut.
     Det promise vi får slängs i dev/null för närvarande. I framtiden ska
     det troligen läggas på någon global operationskö.

  Indirekt async mutate
  =====================
    * En service DataPlay har async metod playaround() som gör följande:
       1. Läser från DataStore asynk.
       2. Muterar asynk.
    * Från annan suspense-service DataFoo hämtar vi en suspendified version av DataPlay (use(DataPlay)).
    * Från rot hämtar vi use(DataFoo) och anropar play()
  
  1. play() anropas och suspenderar.
  2. playaround()'s proxy skapar ActiveQuery och cachar 
  3. När promise resolvar pushas result av playarounds's proxy.
  4. Maskineriet kör om play(). Nu returnerar playaround's proxy från results och pointer++.
  5. Slut.

  Recursion
  =========
  FooBlade.bobb(items) {
    if (items.length > 0) {
       const [first, ...rest] = items;
       use(BobbieStore).mutate([first]);
       this.bobb(rest);
    }
  }

  I detta läge behöver results[] bara ha det slutliga värdet registrerat. Detta gäller alla anrop som
  görs från den första metoden, oavsett om de är rekursiva eller kallar på annan service.

  Foo.bar() {
     use(FooBlade).bobb([1,2]);
     const x = use(BibboStore).read();
     return x + use(Nenne).read();
  }

  FooBlade.bobb(items) {
    if (items.length > 0) {
       const [first, ...rest] = items;
       const f1 = use(BabbaStore).read(first); // Suspenderar!
       use(BobbieStore).mutate([f1]);
       this.bobb(rest);
    }
  }

  I detta läge när Foo.bar() körs:
  1:a körning: suspendera innan resultatet från bobb. then --> results[0] = f1, pointer = 1.
  2:a körning:
    f1 från results[0]
    Mutate anropas en gång. results[1] = undefined, pointer = 2.
    Sedan anropas bobb rekursivt och suspenderar på read() igen: then --> results[2] = f1, pointer = 3.
  3:e körning:
    f1 från results[0]
    Mutate från results[1]
    Rekursion: f1 från results[2]
    Mutate anropas en gång. results[3] = undefined, pointer = 3.
    Rekursion: bobb returnerar undefined --> results[4] = undefined, pointer = 4.
    bobb returnerar vidare undefined --> results[5] = undefined, pointer = 5.
    bobb returnerar vidare undefined --> results[6] = undefined, pointer = 6.
    const x = use(BibboStore).read() --> suspendering: then --> results[7] = x, pointer = 7.
  4:e körning:
    bobb antas vara results[0]. Här blir det fel: x antas vara results[1]!

  Lösning?
  * results är träd, inte array.
  
  1:a körning: root = {results:[],pointer:0,sub: null}
    Foo.bar() anropar bobb(): root.sub = {results:[],pointer:0,sub:null}
    suspendera på read(). then --> root.sub.results[0] = f1, root.sub.pointer = 1.
  2:a körning: 
    Foo.bar() anropar bobb(). bobb vet att den agerar på root.sub.
    f1 från root.sub.results[0]
    Mutate anropas en gång. root.sub.results[1]= undefined, root.sub.pointer = 2.
    Bob reku: root.sub.sub = {...}. suspenderar på read: root.sub.sub.results[0] = f1.
  3:e körning
    Foo.bar() anropar bobb(). bobb vet att den agerar på root.sub.
    f1 från root.sub.results[0]
    Mutate från root.sub.results[1]
    Bob reku: f1 från root.sub.sub.results[0]
    Mutate anropas en gång. root.sub.sub.results[1] = undefined.
    Reku: root.sub.sub.sub = {...} men returnerar, så att root.sub.sub.results[2] = undefined och root.sub.sub.sub = null.
    bobb returnerar vidare så att root.sub.sub = null och root.sub.results[2] = undefined.
    bobb returnerar vidare så att root.sub = null och root.results[0] = undefined.
    const x = use(BibboStore).read() --> suspendering: then --> root.results[1] = x, pointer = 1.
  4:e körning
    bobb() från root.results[0].
    use(BibboStore).read() från root.results[1]
    ...

  Funkar!
    

  SLUTSATSER
  ==========
  suspendifyMethodOrGetter():
  * Kontrollera först om Context.current === Context.root. I så fall utför ett helt annat flöde som
    ska returnera undefined och fånga kastade promises.

  Context.current !== Context.root:
  * Kontrollera om currentAction är truthy. Om inte så kör som nu. Annars:
  * Om pointer < results.length, returnera results[pointer++], annars:
  * Innan anrop, try currentAction = (currentAction.sub || currentAction.sub = {results:[],pointer:0})
    finally { currentAction = lastCurrentAction }
  * Om synk result: results[pointer++] = result, sub = null. Annars:
  * När promise resolvar: results[pointer] = result, sub = null.
  
  Context.current === Context.root:
  * currentAction = {pointer: 0, results: [], sub: null}
  * try...catch..finally{currentAction = null}
  * catch: Om error, throwa vidare. Om promise, then-->pointer = 0, rerun!
  * return undefined.
  
*/
