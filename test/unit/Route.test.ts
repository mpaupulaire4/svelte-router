import '@testing-library/jest-dom';
import Log from '../support/Log.svelte';
import { withInternal } from '../support/helpers';
import Route from 'lib/Route.svelte';

const [render, store] = withInternal();

describe('ChildRoute.svelte', () => {
  it("shouldn't render if there are no handlers", () => {
    // store.set(['', {}, []]);
    const { container } = render(Route);
    expect(container).toHaveTextContent('');
  });

  it('should pass data as data prop', () => {
    store.set(['', {}, [[Log, 'I am an only child']]]);
    const { container } = render(Route);
    expect(container).toHaveTextContent('{ "data": "I am an only child" }');
  });

  it('should pass any props to component handler', () => {
    store.set(['', {}, [[Log, null]]]);
    const { container } = render(Route, { text: 'the more the merrier' });
    expect(container).toHaveTextContent(
      '{ "data": null, "text": "the more the merrier" }'
    );
  });

  it('should render all handlers', () => {
    store.set([
      '',
      {},
      [
        [Log, 'one'],
        [Log, 'two'],
        [Log, 'three'],
        [Log, 'four'],
      ],
    ]);
    const { container } = render(Route);
    expect(container).toHaveTextContent(
      '{ "data": "one" } { "data": "two" } { "data": "three" } { "data": "four" }'
    );
  });
});
