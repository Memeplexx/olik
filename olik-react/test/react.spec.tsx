import '@testing-library/jest-dom';

import { screen, waitFor } from '@testing-library/dom';
import { render } from '@testing-library/react';
import React from 'react';

import { createRootStore, deriveFrom, init, useComponentStore } from '../src';

describe('React', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  beforeAll(() => {
    init();
  })

  it('should create and update a store', () => {
    const select = createRootStore(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test');
    expect(select().read().object.property).toEqual('test');
  })

  it('should useSelector', () => {
    const select = createRootStore(initialState, { devtools: false });
    const App = () => {
      const result = select(s => s.object.property).useState();
      return (
        <>
          <button onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(screen.getByTestId('result').textContent).toEqual(initialState.object.property);
    (screen.getByRole('button') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual('test');
  });

  it('should useDerivation with no deps', async () => {
    const select = createRootStore(initialState, { devtools: false });
    let calcCount = 0;
    const App = () => {
      const result = deriveFrom(
        select(s => s.string),
        select(s => s.object.property),
      ).usingExpensiveCalc((str, prop) => {
        calcCount++;
        return str + prop;
      }).useState();
      return (
        <>
          <button onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(screen.getByTestId('result').textContent).toEqual(initialState.string + initialState.object.property);
    expect(calcCount).toEqual(1);
    (screen.getByRole('button') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual(initialState.string + 'test');
    expect(calcCount).toEqual(2);
  });

  it('should useDerivation with deps', async () => {
    const select = createRootStore(initialState, { devtools: false });
    let calcCount = 0;
    const App = () => {
      const [str, setStr] = React.useState('');
      const [num, setNum] = React.useState(0);
      const result = deriveFrom(
        select(s => s.string),
        select(s => s.object.property)
      ).usingExpensiveCalc((str, prop) => {
        calcCount++;
        return str + prop + num;
      }).useState([num]);
      return (
        <>
          <button data-testid="btn-1" onClick={() => setStr('test')}>Click</button>
          <button data-testid="btn-2" onClick={() => setNum(1)}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(screen.getByTestId('result').textContent).toEqual(initialState.string + initialState.object.property + 0);
    expect(calcCount).toEqual(1);
    (screen.getByTestId('btn-1') as HTMLButtonElement).click();
    expect(calcCount).toEqual(1);
    (screen.getByTestId('btn-2') as HTMLButtonElement).click();
    await waitFor(() => expect(calcCount).toEqual(2));
  });

  it('should create a component store without a parent', () => {
    let renderCount = 0;
    const App = () => {
      const select = useComponentStore(initialState, { componentName: 'unhosted', instanceName: '0', dontTrackWithDevtools: true });
      const result = select(s => s.object.property).useState();
      renderCount++;
      return (
        <>
          <button data-testid="btn-1" onClick={() => select(s => s.object.property).replace('test')}>Click</button>
          <button data-testid="btn-2" onClick={() => select(s => s.string).replace('test')}>Click</button>
          <div data-testid="result">{result}</div>
        </>
      );
    };
    render(<App />);
    expect(renderCount).toEqual(1);
    (screen.getByTestId('btn-1') as HTMLButtonElement).click();
    expect(screen.getByTestId('result').textContent).toEqual('test');
    expect(renderCount).toEqual(2);
    (screen.getByTestId('btn-2') as HTMLButtonElement).click();
    expect(renderCount).toEqual(2);
  });

  it('should create a component store with a parent', () => {
    const parentSelect = createRootStore({
      ...initialState,
      components: {
        component: {} as { [key: string]: { prop: string } }
      }
    }, { devtools: false });
    let renderCount = 0;
    const Child = () => {
      const select = useComponentStore({ prop: '' }, { componentName: 'component', instanceName: '0', dontTrackWithDevtools: true });
      const result = select(s => s.prop).useState();
      renderCount++;
      return (
        <>
          <button data-testid="btn" onClick={() => select(s => s.prop).replace('test')}>Click</button>
          <div>{result}</div>
        </>
      );
    };
    const Parent = () => {
      return (
        <>
          <Child />
        </>
      );
    }
    render(<Parent />);
    expect(renderCount).toEqual(1);
    (screen.getByTestId('btn') as HTMLButtonElement).click();
    expect(renderCount).toEqual(2);
    expect(parentSelect(s => s.components.component).read()).toEqual({ '0': { prop: 'test' } });
  });


  it('component store should receive props from parent', async () => {
    const parentSelect = createRootStore({
      ...initialState,
      components: {
        component2: {} as { [key: string]: { prop: string, num: number } }
      }
    }, { devtools: false });
    const Child: React.FunctionComponent<{ num: number }> = (props) => {
      const select = useComponentStore({ prop: 0 }, { componentName: 'component2', instanceName: '0', dontTrackWithDevtools: true });
      React.useEffect(() => select(s => s.prop).replace(props.num), [props.num, select])
      const result = select(s => s.prop).useState();
      return (
        <>
          <div>{result}</div>
        </>
      );
    };
    const Parent = () => {
      const [num, setNum] = React.useState(0);
      return (
        <>
          <Child num={num} />
          <button data-testid="btn" onClick={() => setNum(num + 1)}>Click</button>
        </>
      );
    }
    render(<Parent />);
    (screen.getByTestId('btn') as HTMLButtonElement).click();
    await waitFor(() => expect(parentSelect(s => s.components.component2).read()).toEqual({ '0': { prop: 1 } }));
  })

  it('should respond to async actions', async () => {
    const select = createRootStore(initialState, { devtools: false });
    const App = () => {
      const state = select(s => s.object.property).useState();
      return (
        <>
          <button data-testid="btn" onClick={() => select(s => s.object.property)
            .replace(() => new Promise(resolve => setTimeout(() => resolve('test'), 10))).asPromise()}>Click</button>
          <div data-testid="result">{state}</div>
        </>
      );
    }
    render(<App />);
    await (screen.getByTestId('btn') as HTMLButtonElement).click();
    await waitFor(() => expect(screen.getByTestId('result').textContent).toEqual('test'));
  });

  it('should respond to async queries', async () => {
    const select = createRootStore(initialState, { devtools: false });
    const fetchString = () => new Promise<string>(resolve => setTimeout(() => resolve('test'), 10))
    const App = () => {
      const {
        wasResolved,
        wasRejected,
        isLoading,
        storeValue
      } = select(s => s.object.property).replace(fetchString).useAsync();
      return (
        <>
          <div data-testid="result">{storeValue}</div>
          {isLoading && <div>Loading</div>}
          {wasResolved && <div>Success</div>}
          {wasRejected && <div>Failure</div>}
        </>
      );
    }
    render(<App />);
    expect(screen.queryByText('Loading')).toBeInTheDocument();
    expect(screen.getByTestId('result').textContent).toEqual('a');
    await waitFor(() => expect(screen.getByTestId('result').textContent).toEqual('test'));
    await waitFor(() => expect(screen.queryByText('Success')).toBeInTheDocument());
    expect(screen.queryByText('Failure')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  })

  it('should be able to paginate', async () => {
    const todos = new Array(15).fill(null).map((e, i) => ({ id: i + 1, text: `value ${i + 1}` }));
    type Todo = { id: Number, text: string };
    const select = createRootStore({
      toPaginate: {} as { [key: string]: Todo[] },
    }, { devtools: false });
    const fetchTodos = (index: number) => new Promise<Todo[]>(resolve => setTimeout(() => resolve(todos.slice(index * 10, (index * 10) + 10)), 10));
    const App = () => {
      const [index, setIndex] = React.useState(0);
      const {
        wasResolved,
        wasRejected,
        isLoading,
        error,
        storeValue,
      } = select(s => s.toPaginate[index]).replaceAll(() => fetchTodos(index)).useAsync([index]);
      return (
        <>
          <button data-testid="btn" onClick={() => setIndex(1)}>Click</button>
          <div data-testid="result">{error}</div>
          {isLoading && <div>Loading</div>}
          {wasResolved && <div>Success</div>}
          {wasRejected && <div>Failure</div>}
          {wasResolved && <div data-testid='todos-length'>{storeValue.length}</div>}
        </>
      );
    }
    render(<App />);
    await waitFor(() => expect(screen.queryByText('Loading')).toBeInTheDocument());
    expect(screen.getByTestId('result').textContent).toEqual('');
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('todos-length').textContent).toEqual('10')
    });
    (screen.getByTestId('btn') as HTMLButtonElement).click();
    await waitFor(() => expect(screen.queryByText('Loading')).toBeInTheDocument());
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('todos-length').textContent).toEqual('5');
    });
  })

});
