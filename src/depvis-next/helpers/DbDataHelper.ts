import { DocumentNode, gql } from "@apollo/client";
import { randomBytes } from "crypto";
import { initializeHttpApollo } from "../apollo/ApolloClient";
import { Component, ComponentDto } from "../types/component";
import { Project } from "../types/project";
import { Vulnerability } from "../types/vulnerability";
const chunkSize = 100;
const client = initializeHttpApollo();

/**
 * Function wrapper responsible for sending GraphQL queries.
 * @param query GraphQL query
 * @param variables Optional variables that will be used in query
 * @returns Data from successful query
 * @throws Error if there were some error during fetch
 */
export async function sendGQLQuery(query: DocumentNode, variables?: Object) {
  console.dir({ gqlRequestType: "query", variables: variables });
  const res = await client.query({ query: query, variables: variables });
  if (res.errors) {
    throw Error(res.errors.toString());
  }
  return res;
}

export async function sendGQLMutation(
  mutation: DocumentNode,
  variables?: Object
) {
  console.dir({ gqlRequestType: "mutation", variables: variables });
  const res = await client.mutate({ mutation: mutation, variables: variables });
  if (res.errors) {
    console.error(res.errors.map((e) => e.message).toString());
    throw Error(res.errors.toString());
  }
  return res;
}

export async function TryGetProjectByName(projectName: string) {
  const query = gql`
    query Project($projectName: String!) {
      projects(where: { name_CONTAINS: $projectName }) {
        id
        name
        versions {
          version
        }
      }
    }
  `;
  const { data } = await sendGQLQuery(query, { projectName: projectName });
  return data.projects;
}

export async function ComponentExists(componentName: string) {
  const query = gql`
    query Component($componentName: String!) {
      components(where: { name_CONTAINS: $componentName }) {
        id
        name
        version
      }
    }
  `;
  const { data } = await sendGQLQuery(query, { componentName: componentName });
  return data.projects.length > 0;
}

export async function CreateComponents(
  components: [Component?],
  projectId: string
) {
  if (!components || components.length == 0) return;
  const mutation = gql`
    mutation CreateComponent($components: [ComponentCreateInput!]!) {
      createComponents(input: $components) {
        __typename
        components {
          purl
        }
      }
    }
  `;

  let res = [];

  for (let i = 0; i < components.length; i += chunkSize) {
    const chunk = components.slice(i, i + chunkSize);
    const chunkWithProjectId = AddProjectToComponents(chunk, projectId);
    const { data } = await sendGQLMutation(mutation, {
      components: chunkWithProjectId,
    });
    res = res.concat(data.components);
  }
  return res;
}

function AddProjectToComponents(components: Component[], projectId: string) {
  const res = components.map((c) => {
    return {
      ...c,
      project: { connect: { where: { node: { id: projectId } } } },
    };
  });
  return res;
}

/**
 * Function will create new project with optional first component
 * @param project Project data
 * @returns Data contained in server response
 */
export async function CreateProject(project: Project) {
  if (!project) return;
  const mutation = gql`
    mutation CreateProject($project: [ProjectCreateInput!]!) {
      createProjects(input: $project) {
        projects {
          id
        }
      }
    }
  `;
  const { data } = await sendGQLMutation(mutation, { project: [project] });
  return data;
}

function generateName() {
  return "gql" + randomBytes(8).toString("hex");
}

export async function GetVulnerability(vulnerabilityId) {
  const query = gql`
    query getVuln($vulnerabilityId: String) {
      vulnerabilities(where: { id_CONTAINS: $vulnerabilityId }) {
        id
        name
      }
    }
  `;
  const { data } = await sendGQLQuery(query, {
    vulnerabilityId: vulnerabilityId,
  });
  return data.vulnerabilities;
}

export async function CreateVulnerability(vulnList: Vulnerability[]) {
  const mutation = gql`
    mutation CreateVulnerability($input: [VulnerabilityCreateInput!]!) {
      createVulnerabilities(input: $input) {
        info {
          nodesCreated
        }
      }
    }
  `;

  const input = vulnList.map((v) => {
    return VulnToGQL(v);
  });
  const { data } = await sendGQLMutation(mutation, {
    input: input,
  });
  return data;
}

export function VulnToGQL(vuln: Vulnerability) {
  const refs = vuln.references
    ? {
        connectOrCreate: [
          ...vuln.references.map((r) => {
            return {
              where: { node: { url: r.url } },
              onCreate: { node: { url: r.url } },
            };
          }),
        ],
      }
    : {};
  return { ...vuln, references: refs };
}

export async function UpdateProjectDependencies(
  projectId: string,
  components: [Component?]
) {
  if (!projectId || components.length == 0) return;
  const mutation = gql`
    mutation UpdateProjectDependencies(
      $projectId: ID
      $componentsPurl: [ComponentWhere!]!
    ) {
      updateProjects(
        where: { id: $projectId }
        update: {
          component: { connect: { where: { node: { OR: $componentsPurl } } } }
        }
      ) {
        __typename
        info {
          relationshipsCreated
        }
      }
    }
  `;

  const { data } = await sendGQLMutation(mutation, {
    projectId: projectId,
    componentsPurl: components.map((c) => {
      return { purl: c.purl };
    }),
  });
  return data;
}

export async function UpdateComponentDependencies(
  dependencies,
  projectId: string
) {
  if (dependencies == null || dependencies.length == 0) return;
  for (let i = 0; i < dependencies.length; i += chunkSize) {
    //TODO: rewrite using variables
    const chunk = dependencies.slice(i, i + chunkSize);
    const chunkMutation = chunk
      .map((dependency) => {
        return getComponentUpdateGQLQuery(
          dependency,
          dependency.dependsOn,
          generateName()
        );
      })
      .join("\n");
    const mutation = gql`
      mutation UpdateComponents ($projectId: ID){
        ${chunkMutation}
      }
    `;
    const { data } = await sendGQLMutation(mutation, { projectId: projectId });
    return data;
  }
}
export async function GetComponents() {
  const query = gql`
    {
      components {
        purl
      }
    }
  `;
  const { data } = await sendGQLQuery(query);
  return data;
}

function getComponentWherePurlPart(array: [Component?]) {
  const res = array.map((c) => {
    return `{purl: \"${c.purl}\", project_SINGLE: {id: $projectId}}`;
  });
  return `[${res.join(",")}]`;
}

function getComponentUpdateGQLQuery(
  dependency,
  dependsOn,
  name = "updateComponent"
) {
  const mutation_content = getComponentWherePurlPart(dependsOn);

  const mutation_part = `${name}: updateComponents(
    where: { purl: \"${dependency.purl}\", project_SINGLE: {id: $projectId}}
    update: {
      dependsOn: {
        connect: {
          where: { node: { OR: ${mutation_content} } }
        }
      }
    }
  ) {
    info {
      relationshipsCreated
    }
  }`;
  return mutation_part;
}

export async function DeleteAllData() {
  const mutation = gql`
    mutation DeleteAll {
      deleteProjects(where: {}) {
        nodesDeleted
      }
      deleteComponents(where: {}) {
        nodesDeleted
      }
      deleteReferences(where: {}) {
        nodesDeleted
      }
      deleteVulnerabilities(where: {}) {
        nodesDeleted
      }
      deleteProjectVersions(where: {}) {
        nodesDeleted
      }
    }
  `;
  const { data } = await sendGQLMutation(mutation);
  return data;
}

export function AddProjectVersionConnectProject(projectId: string) {
  return { connect: { where: { node: { id: projectId } } } };
}

export function CreateComponentsConnectProjectVersion(
  components: [ComponentDto],
  projectVersionId: string
) {
  const ConnectProjectVersion = {
    connect: { where: { node: { id: projectVersionId } } },
  };
  return components.map((c) => {
    return { ...c, projectVersion: ConnectProjectVersion };
  });
}

export function AddComponentsConnectProjectVersion(
  components: Component[],
  projectVersionId: string
) {
  return components.map((c) => {
    return {
      ...c,
      projectVersion: {
        connect: { where: { node: { id: projectVersionId } } },
      },
    };
  });
}
export function BuildAddDependencyQuery(
  dependencies: any[],
  projectVersionId: string
) {
  return dependencies.map((d) => {
    if (!d.dependsOn) return; //No dependency
    return {
      where: { ref: d.ref, projectVersion: { id: projectVersionId } },
      connect: {
        dependsOn: {
          where: {
            node: {
              AND: getDependencyWherePurlPart(d.dependsOn, projectVersionId),
            },
          },
        },
      },
    };
  });
}

function getDependencyWherePurlPart(dependsOn: any[], projectVersionId) {
  const refs = dependsOn.map((d) => {
    return d.ref;
  });
  return { ref_IN: refs, projectVersion: { id: projectVersionId } };
}
