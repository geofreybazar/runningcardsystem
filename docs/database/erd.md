# Entity relationship diagram

Generated from `backend/prisma/schema.prisma`. Only relations declared in the schema are drawn. `RefreshToken`, `RevokedRefreshFamily` and `Settings` have no declared relations; `RefreshToken.userId` holds a user id but is **not** a foreign key.

```mermaid
erDiagram
  FireDistrict ||--o{ City : "has"
  FireDistrict ||--o{ Station : "has"
  FireDistrict |o--o{ User : "district office of"
  City ||--o{ Barangay : "has"
  City |o--o{ Station : "located in"
  City |o--o{ User : "city office of"
  City |o--o{ Incident : "fire in"
  Barangay |o--o{ Incident : "picked for"
  Station ||--o{ Truck : "owns"
  Station ||--o{ IncidentUnit : "sends"
  Truck ||--o{ IncidentUnit : "dispatched as"
  Incident ||--o{ IncidentUnit : "has"
  User ||--o{ Incident : "created (IncidentCreatedBy)"
  User |o--o{ Incident : "closed (IncidentClosedBy)"
  User ||--o{ AuditLog : "performed"
  Incident ||--o{ Notification : "notifies about"
  User ||--o{ Notification : "acted (NotificationActor)"
  User ||--o{ IncidentView : "viewed"
  Incident ||--o{ IncidentView : "viewed by"

  FireDistrict {
    Int id PK
    Int code UK
    String name
    String alias "nullable"
    String color
  }
  City {
    Int id PK
    String name UK
    Int districtId FK
    Json boundary "nullable"
  }
  Barangay {
    Int id PK
    String name "unique with cityId"
    Int cityId FK
    Float lat "nullable"
    Float lng "nullable"
  }
  Station {
    Int id PK
    String name
    Float lat
    Float lng
    Int districtId FK
    Int cityId FK "nullable"
    String address "nullable"
    String contactNumber "nullable"
    Boolean isActive
  }
  Truck {
    Int id PK
    Int stationId FK
    String callSign
    String plateNumber "nullable"
    TruckType type
    Int waterCapacityLiters "nullable"
    TruckOwnership ownership
    TruckStatus status
    Boolean isActive
  }
  User {
    String id PK
    String accountNumber UK
    Rank rank "nullable"
    String firstName
    String middleName "nullable"
    String lastName
    String passwordHash
    Role role
    OfficeLevel officeLevel
    Int districtId FK "nullable"
    Int cityId FK "nullable"
    Boolean isActive
    Boolean mustChangePassword
    DateTime deletedAt "nullable"
    Int notificationsSeenId
  }
  IncidentView {
    String userId PK
    String incidentId PK
    Int seenId
  }
  Notification {
    Int id PK
    String incidentId FK
    Int[] cityIds "involved cities, no FK"
    NotificationType type
    String alarmLevel
    Json units
    String actorId FK
    DateTime createdAt
  }
  Incident {
    String id PK
    Float lat
    Float lng
    String locationLabel
    Int barangayId FK "nullable"
    Int cityId FK "nullable"
    IncidentStatus status
    Int alarmIndex
    Json runningCard
    String createdById FK
    String closedById FK "nullable"
    DateTime createdAt
    DateTime closedAt "nullable"
  }
  IncidentUnit {
    Int id PK
    String incidentId FK
    Int stationId FK
    Int truckId FK
    String alarmLevel
    DateTime dispatchedAt
    DateTime releasedAt "nullable"
  }
  AuditLog {
    Int id PK
    String userId FK
    String action
    String entity
    String entityId
    Json changes "nullable"
    DateTime createdAt
  }
  RefreshToken {
    String id PK
    String familyId
    String userId "not a FK"
    DateTime expiresAt
    DateTime familyExpiresAt
    DateTime usedAt "nullable"
  }
  RevokedRefreshFamily {
    String familyId PK
    DateTime familyExpiresAt
  }
  Settings {
    Int id PK "always 1"
    Int stationsPerAlarm
    Float maxDistanceKm
    String_array alarmLevels
  }
```

Note: `IncidentUnit.alarmLevel` and `Incident.alarmIndex` refer to `Settings.alarmLevels` by name and by position. That link is not a database relation.
