# Dependency visualization - DepVis

Tool for visualization of open source dependencies and vulnerabilities from Software Bill of Materials (SBOM).

This tool was developed as part of Master's thesis "Visualization of Vulnerabilities in Open Source Software Dependencies" at FI MUNI.

## Prerequisites

- Docker & Docker Compose
- Node (> v16)

## Installation

- Clone this repository
- _Optional_ Change login credentials for neo4j by editing [docker-compose.yml](./docker-compose.yml)
- Create environment variables file according to sample file in Next.js app - [example](./src/depvis-next/.env.production.example)
- To start all services use `docker-compose up`
- For more details follow installation steps for Next.js app [here](./src/depvis-next/README.md)

## Repository content

- [sample_bom](./sample_bom/): Contains sample SBOM files for quick testing purposes
- [src/depvis-next](./src/depvis-next/): Next.js web application
- [docker-compose.yml](./docker-compose.yml): Create containers necessary for proper functionality
