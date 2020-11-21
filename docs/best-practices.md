# STATE-MANAGEMENT: BEST PRACTICES #
Oulik, while a fresh take on state management, does still oblige some of the same best practices Redux recommends.  
If you're unfamiliar with using Redux, it may be worth glossing over this guide.

* **Why do we need state-management solutions like this library?**  
Without adequate state-management, if two different views in your application are required to render a users details, they would each need a **copy** of those details first.  
For small applications this is hardly a problem, but for larger applications it quickly becomes hard to know which copy of your state was most recently updated.  
The goal of state-management libraries, such as Redux, is to ensure that there is only one up-to-date version of your application state.  
These libraries prevent you from mutating (changing) state in your store without other parts of your app also receiving that state update.  
The benefit is that every component has the latest, and *only* version of your state making your application far more predictable and easy to debug.

* **How should I organize my state?**  
Like with Redux, it is very important to keep your state tree flattened and normalized.  
Dan Abramov, the author of Redux, explains it better than I could https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape

* **When should I use local component state?**  
You don't have to put all your state in your store. Indeed, components have a nice habit of resetting their internal state when they are destroyed.  
Also, if you want to create reusable library components, you shouldn't couple those components with the store.  
If a certain piece of state is only relevant to a specific component it may not be worth putting in the store, however, if you are still confused about what is going on inside that component, or you want that state to persist when that component is destroyed and re-created, you may want to put that state in the store.

* **Should my form state go into my store?**  
Probably not.  
This can add needless complexity without much benefit.  
That being said, it can be useful to save an incomplete form's state to your store when your component is destroyed. When navigating back to your form, you can patch that form with data from your store so the user does not lose unsaved progress.
