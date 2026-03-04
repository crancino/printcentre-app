import Resolver from '@forge/resolver';
import ForgeUI, { render, Fragment, Text, Button, useProductContext, useState, ModalDialog } from '@forge/ui';

const resolver = new Resolver();

// Main function that renders the button
resolver.define('main', (req) => {
  return render(
    <Fragment>
      <Text>PrintCentre</Text>
      <Button text="Open Print Dialog" onClick="openModal" />
    </Fragment>
  );
});

// Resolver function that handles the modal
resolver.define('resolver', ({ payload, context }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (payload.action === 'openModal') {
    return render(
      <ModalDialog header="Print Request" onClose={() => setIsOpen(false)}>
        <Fragment>
          <Text>This is where the print logic will go.</Text>
          <Text>Request details will be displayed here.</Text>
          <Button text="Close" onClick={() => setIsOpen(false)} />
        </Fragment>
      </ModalDialog>
    );
  }

  return render(
    <Fragment>
      <Text>Action not recognized</Text>
    </Fragment>
  );
});

export const run = resolver.getDefinitions();
export { resolver };
