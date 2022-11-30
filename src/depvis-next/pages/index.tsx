import { gql, useQuery } from '@apollo/client';
import { Container, Spinner } from 'react-bootstrap';
import NoSSRGraph from '../components/Graph/NoSSRGraph';
import ImportForm from '../components/Import/ImportForm';
import React, { useState } from 'react';
import NoSSRGraphWrapper from '../components/Graph/NoSSRGraphWrapper';
import NodeDetail from '../components/Layout/NodeDetail';

const getAllComponentsQuery = gql`
  {
    components {
      name
      __typename
      purl
      version
      deps_count
      depends_on {
        purl
      }
    }
  }
`;

const formatData = (data) => {
  const nodes = [];
  const links = [];
  console.log(data);
  if (!data.components) return { nodes, links };
  data.components.forEach((c) => {
    nodes.push({
      id: c.purl,
      name: c.name,
      deps_count: c.deps_count,
      __typename: c.__typename,
    });
    if (c.depends_on) {
      c.depends_on.forEach((d) => {
        links.push({
          source: c.purl,
          target: d.purl,
        });
      });
    }
  });

  return { nodes, links };
};

function HomePage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedNode, setSelectedNode] = useState('');

  const { data } = useQuery(getAllComponentsQuery, {
    onCompleted: (data) => {
      setLoading(false);
      setGraphData(formatData(data));
    },
    onError: (err) => {
      setLoading(false);
      setErrorMessage(err.message);
    },
  });
  return (
    <>
      {graphData.nodes.length == 0 && (
        <Container className="mx-auto my-5">
          {loading ? (
            <>
              <Container className="d-flex justify-content-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </Container>
              <p className="text-center fs-4 my-3">Loading data</p>
            </>
          ) : errorMessage ? (
            <h1>{errorMessage}</h1>
          ) : (
            <>
              <p className="text-center fs-2 fw-bold">No data!</p>
              <p className="text-center fs-5">Please try importing SBOM file first.</p>
              <Container className="w-50">
                <ImportForm />
              </Container>
            </>
          )}
        </Container>
      )}
      <NoSSRGraphWrapper graphData={graphData} onNodeClick={selectedNode} />
      {/* <NodeDetail name={selectedNode} /> */}
    </>
  );
}

export default HomePage;
