import { Container } from "react-bootstrap";
import { Component } from "../../types/component";
import { DL, DLItem } from "../Details/DescriptionList";

const ProjectStatistics = (props) => {
  const projectInfo = createProjectInfo(props.data);

  const getCVSSScoresAsArray = (vulnerableComponents) => {
    const c = vulnerableComponents
      .map((c) => c.vulnerabilities.map((v) => v.cvssScore))
      .flat();
    return c;
  };

  const getCVSSAvg = (vulnerableComponents) => {
    const res = getCVSSScoresAsArray(vulnerableComponents);
    if (!res || res.length == 0) return;
    return Math.round(res.reduce((p, c) => p + c, 0) / res.length).toPrecision(
      2
    );
  };

  const getImpactScore = () => {
    return Math.round(
      (projectInfo.vulnerableComponents.length / projectInfo.componentsCount) *
        100
    ).toFixed(1);
  };
  if (!projectInfo) return <></>;
  return (
    <Container>
      <DL>
        <DLItem
          label="Total components"
          value={projectInfo.componentsCount}
          horizontal
        />
        <DLItem
          label="Vulnerable components"
          value={projectInfo.vulnerableComponents.length}
          tooltipText="Components that depends on vulnerable component or contain vulnerability"
          horizontal
        />
        <DLItem
          label="Vulnerabilities"
          value={getCVSSScoresAsArray(projectInfo.vulnerableComponents).length}
          horizontal
        />
        <DLItem
          label="Impact factor"
          value={`${getImpactScore()} %`}
          tooltipText="Specify how many % of project use components with at least 1 vulnerability"
          horizontal
        />
        <DLItem
          label="Average CVSS score"
          value={getCVSSAvg(projectInfo.vulnerableComponents)}
          horizontal
        />
      </DL>
    </Container>
  );
};
export default ProjectStatistics;

type projectInfo = {
  name: string;
  version: string;
  componentsCount: number;
  vulnerableComponents: Component[];
};

const createProjectInfo = (data): projectInfo | undefined => {
  if (!data || !data.projectVersions) return undefined;
  const projectVersion = data.projectVersions[0];
  return {
    name: projectVersion.project.name,
    version: projectVersion.version,
    componentsCount: projectVersion.allComponents.length,
    vulnerableComponents: projectVersion.allVulnerableComponents,
  };
};
