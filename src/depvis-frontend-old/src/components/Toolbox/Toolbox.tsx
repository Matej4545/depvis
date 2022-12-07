import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { Button, Container, Tab, Tabs } from 'react-bootstrap';
import { useSbomStore } from '../../providers/SbomProvider';
import { MyNode, INodeProps } from '../Node/MyNode';

export const Toolbox = observer(() => {
  const [query, setQuery] = useState('match (p) return p');
  const [nodes, setNodes] = useState<any>([]);
  const sbomStore = useSbomStore();

  const handleSubmit = () => {
    sbomStore.runQuery(query);
  };

  const matchNode = (node: INodeProps) => {
    if (!nodes.includes(node)) {
      setNodes([node, ...nodes]);
    }
  };
  return (
    <Container>
      <h2>Test queries</h2>
      <input
        type="text"
        onChange={(e) => {
          setQuery(e.target.value || '');
        }}
        value={query}
      />
      <Button
        onClick={() => {
          handleSubmit();
        }}
      >
        Send query
      </Button>
      <Button
        variant="outline-danger"
        onClick={() => {
          sbomStore.removeAll();
        }}
      >
        Remove all nodes
      </Button>
      <Tabs>
        <Tab eventKey="json" title="Json">
          <pre>{sbomStore.json ? sbomStore.json : ''}</pre>
        </Tab>
        <Tab eventKey="node" title="Node" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {sbomStore.project &&
            sbomStore.project.map((r: any) => {
              return <MyNode id={r.Id} name={r.name} properties={r.properties} type={r.label}></MyNode>;
            })}
        </Tab>
      </Tabs>
    </Container>
  );
});