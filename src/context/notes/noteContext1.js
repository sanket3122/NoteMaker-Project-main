// instead of sending props to each component we pass the context to direct function
// here we are using context to verify the user logged in or not.

import { createContext } from 'react';

const noteContext = createContext();

export default noteContext;