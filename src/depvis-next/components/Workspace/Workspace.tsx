import { useLazyQuery } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import { Container, Row } from "react-bootstrap";
import {
  findParentNodes,
  formatData,
  generateLabel,
  getAllComponentsQuery,
  getHighlightedColor,
  getLinkColor,
  getLinkSize,
  getNodeColor,
  getNodeValue,
  resetHighlight,
  resetNodeFix,
} from "../../helpers/GraphHelper";
import usePrevious from "../../helpers/usePreviousHook";
import ComponentDetails from "../Details/ComponentDetails";
import Details from "../Details/Details";
import VulnerabilityDetails from "../Details/VulnerabilityDetails";
import GenericError from "../Error/GenericError";
import { GraphConfig } from "../Graph/GraphConfig";
import GraphControl from "../GraphControl/GraphControl";
import GraphContainer from "../Layout/GraphContainer";
import Sidebar, { SidebarItem } from "../Layout/Sidebar";
import Search from "../Search/Search";
import Legend from "./Legend";
import ProjectStatistics from "./ProjectStatistics";
import ProjectVersionSelector from "./ProjectVersionSelector";

const defaultGraphConfig: GraphConfig = {
  zoomLevel: 1,
  color: getNodeColor,
  label: "id",
  linkDirectionalArrowLength: 5,
  linkDirectionalRelPos: 0,
  linkLength: 10,
  nodeVal: getNodeValue,
  showOnlyVulnerable: false,
  connectNodesToRoot: false,
  graphForce: 0.1,
};

const Workspace = () => {
  const [node, setNode] = useState(undefined);
  const [graphConfig, setGraphConfig] =
    useState<GraphConfig>(defaultGraphConfig);
  const prevGraphConfig = usePrevious<GraphConfig>(graphConfig);
  const [filteredData, setFilteredData] = useState<any>(undefined);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedProjectVersion, setSelectedProjectVersion] = useState<
    string | undefined
  >();
  const [getGraphData, { loading, error, data }] = useLazyQuery(
    getAllComponentsQuery
  );

  useEffect(() => {
    if (data) {
      const selectedData =
        prevGraphConfig && prevGraphConfig.showOnlyVulnerable
          ? data.projectVersions[0].allVulnerableComponents
          : data.projectVersions[0].allComponents;
      setFilteredData(selectedData);
    }
  }, [data]);

  useEffect(() => {
    if (filteredData) {
      setGraphData(formatData(filteredData, graphConfig.connectNodesToRoot));
    }
  }, [filteredData]);

  useEffect(() => {
    console.log({
      event: "Workspace detected projectVersion change",
      data: selectedProjectVersion,
    });

    if (selectedProjectVersion) {
      getGraphData({
        variables: { projectVersionId: selectedProjectVersion },
      });
    }
  }, [selectedProjectVersion]);

  useEffect(() => {
    if (
      prevGraphConfig &&
      prevGraphConfig.showOnlyVulnerable !== graphConfig.showOnlyVulnerable
    )
      handleShowOnlyVulnerableToggle();
    if (
      prevGraphConfig &&
      prevGraphConfig.connectNodesToRoot !== graphConfig.connectNodesToRoot
    )
      setGraphData(formatData(filteredData, graphConfig.connectNodesToRoot));
  }, [graphConfig]);

  const handleNodeClick = (node) => {
    const p = findParentNodes(graphData.links, node.id);
    p.add(node.id);
    resetHighlight(graphData.nodes);
    p.forEach((item) => {
      const index = graphData.nodes.findIndex((n) => n.id == item);
      if (index >= 0) graphData.nodes[index].highlight = true;
    });

    setNode(node);
  };

  const unselectNode = () => {
    resetHighlight(graphData.nodes);
    setNode(undefined);
  };
  const handleShowOnlyVulnerableToggle = () => {
    if (!data) return;
    if (graphConfig.showOnlyVulnerable) {
      setFilteredData(data.projectVersions[0].allVulnerableComponents);
    } else {
      setFilteredData(data.projectVersions[0].allComponents);
    }
  };

  const handleSelectedSearchResult = (object) => {
    handleNodeClick(object);
  };

  const paintRing = useCallback(
    (currNode, ctx) => {
      if (node && node.id === currNode.id) {
        const nodeSize =
          typeof graphConfig.nodeVal === "function" ? currNode.size : 1;
        ctx.beginPath();
        ctx.arc(
          currNode.x,
          currNode.y,
          (Math.sqrt(nodeSize) * 4 + 1) | 1,
          0,
          2 * Math.PI,
          false
        );
        ctx.fillStyle = getHighlightedColor(currNode, node);
        ctx.fill();
      }
    },
    [node]
  );

  const handleProjectVersion = (projectVersion: string) => {
    setSelectedProjectVersion(projectVersion);
  };

  const renderSidebar = () => {
    return (
      <Sidebar>
        <SidebarItem title="Select project" fixed>
          <ProjectVersionSelector
            onProjectVersionSelect={handleProjectVersion}
          />
        </SidebarItem>
        <SidebarItem title="Project details">
          <ProjectStatistics data={data} />
        </SidebarItem>
        <SidebarItem title="Search nodes" fixed>
          <Search
            objects={graphData.nodes}
            searchResultCallback={(obj) => handleSelectedSearchResult(obj)}
          />
        </SidebarItem>
        <SidebarItem title="Graph controls" collapse>
          <GraphControl
            defaultGraphConfig={defaultGraphConfig}
            onGraphConfigChange={(val) => {
              setGraphConfig(val);
            }}
            onRefetchGraphClick={() => {
              getGraphData({
                variables: { projectId: selectedProjectVersion },
                fetchPolicy: "no-cache",
              });
            }}
          />
        </SidebarItem>
        <SidebarItem title="Node detail">
          {node && node.__typename === "Component" && (
            <ComponentDetails
              componentId={node.id}
              projectId={selectedProjectVersion}
            />
          )}
          {node && node.__typename === "Vulnerability" && (
            <VulnerabilityDetails vulnerabilityId={node.id} />
          )}

          {process.env.NODE_ENV === "development" && (
            <Details data={node} title="Development details" />
          )}
        </SidebarItem>
        <SidebarItem title="Legend">
          <Legend />
        </SidebarItem>
      </Sidebar>
    );
  };
  if (!selectedProjectVersion)
    return (
      <ProjectVersionSelector onProjectVersionSelect={handleProjectVersion} />
    );

  if (error) return <GenericError error={error} />;
  return (
    <Container fluid>
      <Row className="workspace-main">
        {renderSidebar()}

        <GraphContainer
          nodeCanvasObject={paintRing}
          nodeLabel={(node) => generateLabel(node)}
          selectedNode={node}
          isLoading={loading}
          graphData={graphData}
          onNodeClick={(node) => handleNodeClick(node)}
          linkColor={(link) => getLinkColor(link)}
          linkWidth={(link) => getLinkSize(link)}
          graphConfig={graphConfig}
          onNodeDragEnd={(node) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          onNodeRightClick={(node) => {
            resetNodeFix(node);
          }}
          onBackgroundClick={() => {
            unselectNode();
          }}
        />
      </Row>
    </Container>
  );
};

export default Workspace;
