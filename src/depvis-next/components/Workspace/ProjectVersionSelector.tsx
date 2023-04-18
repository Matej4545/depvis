import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { getProjectVersionsQuery } from "../../helpers/GraphHelper";
import Dropdown, { DropdownItem } from "../Dropdown/Dropdown";
import NoProjectFoundError from "../Error/NoProjectFoundError";
import Loading from "../Loading/Loading";
import GenericError from "../Error/GenericError";

type ProjectSelectorProps = {
  onProjectVersionSelect?: (projectVersionId: string) => void;
};
const ProjectVersionSelector = (props: ProjectSelectorProps) => {
  const { onProjectVersionSelect } = props;
  const [projectVersion, setProjectVersion] = useState<any>(undefined);
  const router = useRouter();
  const {
    data: projects,
    loading: projectsLoading,
    error,
  } = useQuery(getProjectVersionsQuery, {
    onCompleted: (data) => {
      selectProjectVersion(data);
    },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (projectVersion) {
      onProjectVersionSelect(projectVersion);
    }
  }, [projectVersion]);

  const handleProjectVersionSelect = (e: any) => {
    setProjectVersion(e);
  };

  const selectProjectVersion = (data) => {
    const { projectName, projectVersion } = router.query;
    if (
      !projectName ||
      data.projectVersions.filter((p) => p.project.name === projectName)
        .length == 0
    ) {
      setProjectVersion(data.projectVersions[0].id);
      return;
    }
    const project = data.projectVersions.find(
      (p) => p.project.name === projectName
    );
    setProjectVersion(
      data.projectVersions.find((p) => p.project.name === projectName).id
    );
  };

  if (projectsLoading) return <Loading detail="Loading projects" />;
  if (error) return <GenericError error={error} />;

  if (!projectsLoading && projects.projectVersions.length == 0) {
    return <NoProjectFoundError />;
  }
  return (
    <>
      {!projectsLoading && projectVersion && (
        <Dropdown
          options={projects.projectVersions.map((p) => {
            return { id: p.id, displayName: `${p.project.name} v${p.version}` };
          })}
          onChange={(e) => handleProjectVersionSelect(e)}
          defaultValue={projectVersion}
        />
      )}
    </>
  );
};

const selectVersion = (project, queryProjectVersion) => {
  if (project.versions.length == 0) {
    console.log("Project %s does not have any versions", project.id);
    return;
  }
  if (
    !queryProjectVersion ||
    project.versions.filter((v) => v.version === queryProjectVersion).length ==
      0
  ) {
    return project.versions[0];
  }
  return project.versions.filter((v) => v.version === queryProjectVersion)[0];
};

export default ProjectVersionSelector;
