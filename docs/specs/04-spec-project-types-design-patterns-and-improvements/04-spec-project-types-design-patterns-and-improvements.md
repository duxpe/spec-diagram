# Spec — Pattern Selection Before Project Creation and Pattern-Aware Diagramming

## 1. Objective

Implement in the MVP an explicit selection of one of the `8` supported architectural patterns during new project/workspace creation, persist that choice in the database, and use it to:

- filter the available building blocks shown in the project
- filter the connection types shown and allowed
- guide next-node suggestions during diagram construction
- improve semantic consistency of the diagram with the selected pattern

The `8` supported patterns are:

- `hexagonal`
- `layered_n_tier`
- `microservices`
- `microkernel`
- `mvc`
- `space_based`
- `client_server`
- `master_slave`

---

## 2. Scope

This spec covers:

- popup/modal pattern selection before project creation
- persistence of the selected architecture pattern on the project/workspace
- node catalog by pattern
- connection catalog by pattern
- filtering of the node/block library by selected pattern
- preservation of existing `N2` and `N3`
- manual inversion of connection direction during edge creation
- contextual suggestion of the next node when dropping a connection on empty space
- UX, validation, and acceptance criteria

This spec does not cover:

- automatic retroactive migration of existing diagrams to another pattern
- full automatic diagram generation
- AI inference of the ideal pattern
- semantic migration between patterns

---

## 3. Product Principle

Each project must be created with one **primary architectural pattern**.

This pattern does not prevent the user from modeling details in `N2` and `N3`, but it defines the main vocabulary available at the architectural level and the most relevant connection types for that context.

Central rule:

- the project pattern governs mainly the root board `N1`
- `N2` and `N3` continue supporting the blocks already defined in previous specs
- the system should reduce semantic and visual noise by showing only nodes and relationships coherent with the selected pattern

---

## 4. Project Creation Flow

### 4.1 New Mandatory Step

Before finishing project creation, the system must open a popup/modal for architecture pattern selection.

Suggested flow:

1. user clicks `New Project`
2. system opens the creation modal with project name and description
3. before final creation, the system shows a step or section `Choose the architectural pattern`
4. user selects `1` of the `8` supported patterns
5. system shows a short description and small visual preview of the selected pattern
6. user confirms project creation
7. project is persisted with the selected pattern
8. root board `N1` opens with node library and connection types already filtered

### 4.2 UX Requirements for the Popup

The popup must:

- be simple and quick to decide
- show the `8` patterns as clickable cards
- display name, short description, and small visual preview for each pattern
- highlight the currently selected card clearly
- only allow final confirmation when one pattern is selected
- leave room for a future `change project pattern` action, but that is outside MVP scope

### 4.3 Suggested Text

Title:

- `Choose the architectural pattern for this project`

Subtitle:

- `This choice defines the suggested blocks and connections on the main board.`

Primary CTA:

- `Create project`

---

## 5. Data Model

### 5.1 Architecture Pattern Enum

The project/workspace must persist one of these values:

- `hexagonal`
- `layered_n_tier`
- `microservices`
- `microkernel`
- `mvc`
- `space_based`
- `client_server`
- `master_slave`

### 5.2 Workspace Extension

The workspace/project entity must include a new persisted field:

- `architecturePattern`

Suggested workspace structure:

- `id`
- `name`
- `description`
- `rootBoardId`
- `boardIds`
- `architecturePattern`
- `createdAt`
- `updatedAt`

### 5.3 Optional Metadata for Future Evolution

A future-compatible metadata structure may exist for overrides, even if not fully used in the MVP:

- `projectId`
- `architecturePattern`
- `customNodeWhitelist`
- `customRelationWhitelist`
- `createdAt`
- `updatedAt`

For MVP, this metadata can remain implicit if the allowed node/relation catalog is entirely derived from the pattern.

---

## 6. Compatibility Rules With Semantic Levels

### 6.1 N1

`N1` must be strongly filtered by the selected project pattern.

This means that the `N1` node library, next-node suggestions, and relation choices must be derived from the project pattern.

### 6.2 N2

`N2` keeps using the blocks already defined in the existing specs:

- `class`
- `interface`
- `api_contract`
- `free_note_input`
- `free_note_output`

### 6.3 N3

`N3` keeps using the blocks already defined in the existing specs:

- `method`
- `attribute`
- `free_note_input`
- `free_note_output`

### 6.4 Important Rule

Even in projects filtered by pattern, `N2` and `N3` must not lose capability.

Requested MVP behavior:

- in `N1`, filter by pattern
- in `N2` and `N3`, keep the already supported block sets
- classes, interfaces, methods, and attributes continue available as defined in prior specs

---

## 7. Node Catalog by Pattern

The system must maintain a central registry describing which nodes are allowed, suggested, and default for each pattern.

Each node entry should minimally define:

- internal type
- UI label
- semantic level
- visual shape
- icon
- whether it is required or suggested

Each pattern entry should minimally define:

- pattern id
- display name
- short description
- allowed `N1` nodes
- allowed relations

### 7.1 Hexagonal / Ports and Adapters

Allowed `N1` nodes:

- `system` → Application Core / Domain
- `port` → Primary Port / Secondary Port
- `adapter` → Primary Adapter / Secondary Adapter
- `external_system` → external API / external dependency / external actor
- `database` → persistence resource
- `decision`
- `free_note_input`
- `free_note_output`

Recommended semantic mapping:

- `system` = application core
- `port` = inbound or outbound port
- `adapter` = inbound or outbound adapter
- `external_system` = external actor or external system
- `database` = external persistent resource

### 7.2 Layered (N-Tier)

Allowed `N1` nodes:

- `container_service` → Presentation Layer
- `container_service` → Business Layer
- `container_service` → Data Access Layer
- `database` → Data Tier
- `external_system`
- `decision`
- `free_note_input`
- `free_note_output`

Observation:

- the same base type `container_service` may use different visual roles or stereotypes for each layer

### 7.3 Microservices

Allowed `N1` nodes:

- `container_service` → Microservice
- `container_service` → API Gateway
- `database` → per-service datastore
- `external_system`
- `container_service` → identity/auth service
- `container_service` → config service / service registry / observability service
- `decision`
- `free_note_input`
- `free_note_output`

### 7.4 Microkernel

Allowed `N1` nodes:

- `system` → Core System / Microkernel
- `container_service` → Host Application / Loader / Runtime Manager
- `adapter` or `port` → Extension Interface / Plugin Contract
- `container_service` → Plugin Component
- `container_service` → Plugin Registry
- `database` → plugin or core store
- `decision`
- `free_note_input`
- `free_note_output`

### 7.5 MVC

Allowed `N1` nodes:

- `external_system` → User
- `container_service` → Router / Dispatcher
- `container_service` → Controller
- `container_service` → View
- `container_service` → Model
- `container_service` → Repository / Service Layer
- `database`
- `external_system` → External API
- `decision`
- `free_note_input`
- `free_note_output`

### 7.6 Space-Based

Allowed `N1` nodes:

- `container_service` → Processing Unit
- `container_service` → Messaging Grid / Request Router
- `container_service` → Processing Grid
- `container_service` → Replication Engine
- `container_service` → Data Pump / Data Reader / Data Writer
- `database`
- `external_system`
- `decision`
- `free_note_input`
- `free_note_output`

### 7.7 Client-Server

Allowed `N1` nodes:

- `external_system` → Client
- `container_service` → Server
- `container_service` → Application Server
- `database` → Database Server
- `container_service` → Auth Server / File Server / Load Balancer
- `decision`
- `free_note_input`
- `free_note_output`

### 7.8 Master-Slave

Allowed `N1` nodes:

- `container_service` → Master
- `container_service` → Worker / Slave
- `container_service` → Scheduler / Dispatcher
- `container_service` → Result Collector / Comparator
- `container_service` → Task Queue
- `database` → Shared Store
- `external_system` → Client / Initiator
- `decision`
- `free_note_input`
- `free_note_output`

---

## 8. Pattern-Aware Node Visibility Rules

### 8.1 Sidebar / Creation Library

The node creation library must show only:

- nodes valid for the project pattern when the user is on `N1`
- `N2` nodes when the user is on an `N2` board
- `N3` nodes when the user is on an `N3` board

### 8.2 Contextual Labels

Even if a base domain type is reused internally, the UI must display labels coherent with the selected pattern.

Examples:

- in `hexagonal`, `system` appears as `Application Core`
- in `microservices`, `container_service` may appear as `Microservice`
- in `mvc`, `container_service` may appear as `Controller`, `View`, or `Model`

### 8.3 Shape and Icon

The visual identity from the UI/UX spec should be applied using:

- base node type
- contextual variant by pattern
- icon and shape suggested by node role

---

## 9. Connection Types by Pattern

The system must maintain a catalog of relations per pattern.

Each relation definition should minimally describe:

- internal type
- UI label
- short description
- whether it is directional
- allowed source node types
- allowed target node types
- use cases or suggested contexts

### 9.1 Global Base Relations

The domain may keep a generic pool of reusable relations such as:

- `depends_on`
- `uses`
- `calls`
- `reads_from`
- `writes_to`
- `sends_to`
- `receives_from`
- `routes_to`
- `contains`
- `extends`
- `implements`
- `delegates_to`
- `publishes_to`
- `subscribes_to`
- `requests_from`
- `responds_to`
- `invokes`
- `communicates_with`

Not all of these should be shown in all patterns.

### 9.2 Hexagonal Recommended Relations

Show only relations meaningful for Hexagonal, such as:

- `exposes_port`
- `implemented_by_adapter`
- `invokes`
- `depends_on`
- `reads_from`
- `writes_to`
- `publishes_to`
- `subscribes_to`

Examples:

- `Application Core -> Port` = `exposes_port`
- `Adapter -> Port` = `implemented_by_adapter` or `invokes`
- `Adapter -> Database` = `reads_from` or `writes_to`
- `Adapter -> External System` = `communicates_with`

### 9.3 Layered Recommended Relations

Show only relations meaningful for Layered, such as:

- `calls`
- `depends_on`
- `reads_from`
- `writes_to`
- `serves`
- `uses`

Examples:

- `Presentation Layer -> Business Layer` = `calls`
- `Business Layer -> Data Access Layer` = `calls`
- `Data Access Layer -> Database` = `reads_from` or `writes_to`

### 9.4 Microservices Recommended Relations

Show only relations meaningful for Microservices, such as:

- `routes_to`
- `calls`
- `publishes_to`
- `subscribes_to`
- `reads_from`
- `writes_to`
- `authenticates_with`
- `registers_in`
- `communicates_with`

Examples:

- `API Gateway -> Microservice` = `routes_to`
- `Microservice -> Database` = `reads_from` or `writes_to`
- `Microservice -> Broker` = `publishes_to` or `subscribes_to`
- `Microservice -> Microservice` = `calls` or `communicates_with`

### 9.5 Microkernel Recommended Relations

Show only relations meaningful for Microkernel, such as:

- `extends`
- `implements`
- `registers_in`
- `loads`
- `invokes`
- `depends_on`
- `reads_from`
- `writes_to`

Examples:

- `Plugin -> Plugin Contract` = `implements`
- `Core -> Plugin` = `loads` or `invokes`
- `Plugin -> Registry` = `registers_in`

### 9.6 MVC Recommended Relations

Show only relations meaningful for MVC, such as:

- `routes_to`
- `calls`
- `updates`
- `renders`
- `reads_from`
- `writes_to`
- `uses`

Examples:

- `Router -> Controller` = `routes_to`
- `Controller -> Model` = `calls`
- `Controller -> View` = `renders`
- `Model -> Database` = `reads_from` or `writes_to`

### 9.7 Space-Based Recommended Relations

Show only relations meaningful for Space-Based, such as:

- `routes_to`
- `replicates_to`
- `writes_to`
- `reads_from`
- `publishes_to`
- `consumes_from`
- `synchronizes_with`

Examples:

- `Messaging Grid -> Processing Unit` = `routes_to`
- `Processing Unit -> Data Writer` = `writes_to`
- `Data Reader -> Processing Unit` = `reads_from`
- `Replication Engine -> Processing Grid` = `replicates_to`

### 9.8 Client-Server Recommended Relations

Show only relations meaningful for Client-Server, such as:

- `requests_from`
- `responds_to`
- `authenticates_with`
- `reads_from`
- `writes_to`
- `serves`

Examples:

- `Client -> Server` = `requests_from`
- `Server -> Client` = `responds_to`
- `Application Server -> Database Server` = `reads_from` or `writes_to`

### 9.9 Master-Slave Recommended Relations

Show only relations meaningful for Master-Slave, such as:

- `delegates_to`
- `returns_to`
- `queues_for`
- `aggregates_from`
- `reads_from`
- `writes_to`
- `monitors`

Examples:

- `Master -> Worker` = `delegates_to`
- `Worker -> Master` = `returns_to`
- `Master -> Task Queue` = `queues_for`
- `Result Collector -> Master` = `aggregates_from`

---

## 10. Connection Filtering Rules

When the user starts a connection between two nodes, the relation picker must show only relations that are:

- valid for the current project pattern
- valid for the current semantic level
- valid for the source node role/type
- valid for the target node role/type
- valid for the current direction of the edge

This means the relation menu must be computed dynamically from:

- project pattern
- board level
- source node type
- source node role
- target node type
- target node role
- direction

If no relation is valid, the system should:

- show a clear empty state message
- allow the user to cancel
- never silently create an invalid relation

Suggested empty state text:

- `No recommended connection type is available for these blocks in the selected pattern.`

---

## 11. Connection Direction Inversion During Edge Creation

### 11.1 Objective

When the user starts a connection from one node to another, they must be able to quickly invert the arrow/dependency direction without canceling and redoing the gesture.

### 11.2 Functional Rule

When the user drags a connection from node `A` to node `B` and the relation selection popup opens, there must be a visible action `Invert direction`.

This action must:

- swap `sourceNodeId` and `targetNodeId`
- update the visual preview of the arrow
- recompute the valid relation list based on the new direction
- preserve the current creation flow without forcing the user to restart

### 11.3 Suggested UI

The connection popup should display:

- current source label
- current target label
- a button with opposing arrows icon
- textual preview such as `A -> B` or `B -> A`

### 11.4 Draft Connection State

A pending connection state should minimally keep:

- `sourceNodeId`
- `targetNodeId`
- `sourceHandle`
- `targetHandle`
- `boardId`
- `projectPattern`
- `inferredLevel`

---

## 12. Suggest Next Node When Dropping a Connection on Empty Space

### 12.1 Objective

When the user starts a connection from an existing node and releases it on empty board space, the system should help continue the diagram naturally instead of interrupting the flow.

### 12.2 Expected Behavior

Flow:

1. user starts a connection from an existing node
2. user drops the connection on empty space
3. system opens a contextual popup `Suggested next block`
4. popup shows node suggestions coherent with:
   - project pattern
   - source node type
   - current edge direction
   - the most common semantic continuations for that pattern
5. user chooses a suggested node type
6. system creates the new node at the drop position
7. system automatically creates the connection between source and new node
8. if necessary, system asks for the exact relation type or applies a recommended default with a chance to adjust

### 12.3 Suggestion Rules

Suggestions must be ordered by relevance.

Priority criteria:

1. compatibility with the project pattern
2. expected semantic frequency for that pattern
3. compatibility with the source node type
4. compatibility with the current connection direction

### 12.4 Suggestion Examples

#### Hexagonal

Origin: `system`

Suggested next nodes:

- `port`
- `adapter`
- `database`
- `external_system`

Origin: `port`

Suggested next nodes:

- `adapter`
- `system`
- `external_system`

#### Layered

Origin: `Presentation Layer`

Suggested next nodes:

- `Business Layer`
- `External Service`

Origin: `Business Layer`

Suggested next nodes:

- `Data Access Layer`
- `Database`

#### Microservices

Origin: `API Gateway`

Suggested next nodes:

- `Microservice`
- `Auth Service`

Origin: `Microservice`

Suggested next nodes:

- `Database`
- `Message Broker`
- `External System`
- `Microservice`

#### MVC

Origin: `Router`

Suggested next nodes:

- `Controller`

Origin: `Controller`

Suggested next nodes:

- `Model`
- `View`
- `Repository`

#### Master-Slave

Origin: `Master`

Suggested next nodes:

- `Worker`
- `Task Queue`
- `Result Collector`

### 12.5 Suggestion Popup UX

The popup must:

- open close to the drop point
- show at most `5` to `8` main suggestions
- allow quick search by name
- show icon, label, and very short description
- allow cancel without creating anything

### 12.6 Default Suggested Relation

When creating a new node from an empty-space connection drop, the system may preselect a default relation.

Examples:

- `master -> worker` = `delegates_to`
- `gateway -> microservice` = `routes_to`
- `controller -> model` = `calls`
- `adapter -> database` = `writes_to` or `reads_from`

If ambiguous, the system should create the node first and then open the relation picker.

---

## 13. Suggested Domain Services

The implementation should have a central pattern catalog service responsible for:

- returning the pattern definition
- returning allowed `N1` nodes for a pattern
- returning allowed relations based on pattern, level, source type, and target type
- returning suggested next nodes based on pattern, level, source type, and edge direction

A project creation service should:

- create a project with `name`
- optional `description`
- mandatory `architecturePattern`

A connection assist service should:

- invert a pending connection draft
- suggest next nodes when the user drops on empty space
- support default relation inference when possible

---

## 14. Persistence and Reopening

When reopening a project, the system must:

- load `architecturePattern` from the project
- initialize the node library according to that pattern
- initialize relation filtering according to that pattern
- preserve compatibility with diagrams already saved inside that project

### 14.1 Compatibility With Older Projects

For projects created before this spec, the system may adopt a fallback strategy.

Suggested MVP approach:

- projects without `architecturePattern` are treated internally as `untyped_legacy`
- in those cases, show the broader legacy node catalog without strong filtering

Although this compatibility state may exist internally, it should not be exposed as a normal pattern choice in new project creation.

---

## 15. Validation Rules

### 15.1 During Project Creation

- a project cannot be created without `architecturePattern`
- the value must be one of the `8` supported enum values

### 15.2 During N1 Node Creation

- the requested node type must exist in the selected pattern catalog
- if a reused base type is shown under a contextual label, the saved node payload should also keep the contextual role

Recommended node payload concepts:

- `id`
- `workspaceId`
- `boardId`
- `level`
- `type`
- `patternRole`
- `title`
- `description`
- `data`

### 15.3 During Relation Creation

- the selected relation must be valid for the project pattern and for the final arrow direction
- if direction is inverted, validation must be recomputed immediately

### 15.4 During Empty-Space Suggestion

- only nodes valid for the selected pattern may be suggested in `N1`
- in `N2` and `N3`, continue using the normal level-specific catalog

---

## 16. UI Rules

### 16.1 Where Pattern Filtering Must Affect the Product

Pattern filtering must impact:

- project creation popup
- sidebar or floating menu for node creation
- relation selection popup
- next-node suggestion popup for empty-space drop
- contextual labels and descriptions

### 16.2 Visible Feedback of the Active Pattern

The project should show the active pattern in a discreet but visible way.

Suggested options:

- badge in the project header
- chip near the board name
- label in empty states of the node library

### 16.3 Visual Consistency

The active pattern must not change the global product theme.

It should change only:

- available visual vocabulary
- contextual labels and icons
- recommended nodes and relations

---

## 17. Main Use Cases

### Case 1 — Create a Hexagonal Project

- user creates a project
- user selects `Hexagonal`
- when opening `N1`, the library shows `Application Core`, `Port`, `Adapter`, `External System`, `Database`
- when connecting `Adapter` to `Database`, the relation popup offers `reads_from` and `writes_to`

### Case 2 — Invert Connection Direction Without Restarting

- user drags a connection from `Controller` to `Router`
- in the popup, the user notices the correct direction is `Router -> Controller`
- user clicks `Invert direction`
- system swaps source and target and recomputes valid relations

### Case 3 — Connect to Empty Space With Assistance

- user drags a connection from `API Gateway` and drops it on empty space
- popup suggests `Microservice`, `Auth Service`, and `External System`
- user chooses `Microservice`
- node is created and automatically connected using suggested relation `routes_to`

### Case 4 — Preserve N2 and N3

- user enters `N2` details of a microservice
- user still sees `class`, `interface`, `api_contract`, and notes
- user enters `N3`
- user still sees `method`, `attribute`, and notes

---

## 18. Acceptance Criteria

### Functional

- Choosing one of the `8` patterns is mandatory when creating a new project.
- The chosen pattern is saved in the database and loaded correctly on reopen.
- The `N1` library shows only nodes valid for that pattern.
- `N2` and `N3` keep the blocks already defined in the existing specs.
- The connection popup shows only relations compatible with the selected pattern and the current edge direction.
- The user can invert edge direction without restarting the connection gesture.
- Dropping a connection on empty space triggers coherent next-node suggestions.
- Choosing a suggestion creates the node and connects it automatically.

### Semantic

- The `N1` vocabulary becomes more coherent with the project pattern.
- The system reduces irrelevant combinations and improves board consistency.
- Next-node suggestions respect both the selected pattern and the connection context.

### UX

- Pattern selection is clear and fast.
- Direction inversion is understandable and visible.
- Creating a node from an empty-space connection drop feels natural and fluid.

---

## 19. Out of Scope

- allowing multiple primary patterns inside the same project in the MVP
- changing the project pattern and automatically migrating all existing nodes
- fully automatic diagram generation
- deep architectural linting
- advanced warnings for pattern violations

---

## 20. Definition of Done

This implementation is done when the user can create a project already associated with one of the `8` supported architectural patterns, model `N1` with pattern-filtered nodes and connection types, invert edge direction without rework, and expand the diagram through contextual node suggestions when dropping a connection on empty space, while preserving `N2` and `N3` exactly as already defined in the MVP specs.