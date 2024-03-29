import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import {
  graphExcludedNode,
  graphHighlightedLink,
  graphHighlightedNode,
  graphLink,
  graphMainComponentNode,
  graphNode,
  graphSelectedNode,
  vulnerabilityCriticalColor,
  vulnerabilityHighColor,
  vulnerabilityHighlightedColor,
  vulnerabilityLowColor,
  vulnerabilityMediumColor,
} from "../../types/colorPalette";

const Legend = () => {
  const vulnItems = [
    { color: vulnerabilityCriticalColor, label: "Critical vulnerability" },
    { color: vulnerabilityHighColor, label: "High vulnerability" },
    { color: vulnerabilityMediumColor, label: "Medium vulnerability" },
    { color: vulnerabilityLowColor, label: "Low vulnerability" },
    {
      color: vulnerabilityHighlightedColor,
      label: "Highlighted vulnerability",
    },
  ];
  const nodeItems = [
    { color: graphMainComponentNode, label: "Project" },
    { color: graphNode, label: "Component" },
    { color: graphSelectedNode, label: "Selected component" },
    { color: graphHighlightedNode, label: "Highlighted component" },
    { color: graphExcludedNode, label: "Excluded component" },
  ];
  const linkItems = [
    { color: graphLink, label: "Link" },
    { color: graphHighlightedLink, label: "Highlighted Link" },
  ];

  const controlItems = [
    { action: "Zoom In / Out", command: "Mouse wheel up / down" },
    {
      action: "Move & Pin node",
      command: "Mouse click and drag",
      tooltip:
        "Node can be dragged and pinned in specific spot. Use right click to unpin it.",
    },
    {
      action: "Unpin node",
      command: "Mouse Right Click",
      tooltip: "Right click on pinend node to unpin it",
    },
    {
      action: "Open information",
      command: "Mouse Left click",
      tooltip:
        "By clicking on node, a path from the node to root node will be highlighted. Click outside to reset highlight.",
    },
  ];

  const mapItems = (items) => {
    return items.map((n, i: number) => {
      return (
        <Stack id={n.color} key={i} direction="horizontal">
          <FontAwesomeIcon
            icon={faCircle}
            color={n.color}
            className="mx-2 my-1"
            size="lg"
          />
          <span>{n.label}</span>
        </Stack>
      );
    });
  };

  const mapControlItems = () => {
    return controlItems.map((c, i: number) => {
      return (
        <OverlayTrigger
          key={i}
          placement="right"
          overlay={
            c.tooltip ? <Tooltip id="tooltip">{c.tooltip}</Tooltip> : <></>
          }
        >
          <Stack id={c.action} direction="horizontal">
            <span style={{ fontWeight: "600" }} className="mx-`">
              {c.action}:
            </span>
            <span className="mx-2">{c.command}</span>
          </Stack>
        </OverlayTrigger>
      );
    });
  };
  return (
    <>
      <strong>Components & Project</strong>
      {mapItems(nodeItems)}
      <strong>Links</strong>
      {mapItems(linkItems)}
      <strong>Vulnerabilities</strong>
      {mapItems(vulnItems)}
      <strong>Navigating graph</strong>
      {mapControlItems()}
    </>
  );
};
export default Legend;
