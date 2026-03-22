# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Building Energy Intelligent Management and Operation System (建筑能源智能管理系统) - A web-based energy monitoring and analytics platform for building management.

**Tech Stack:**
- Backend: Spring Boot 4.0.3 + JPA + PostgreSQL
- Database: PostgreSQL (database: `energy_mos`, default port: 5432)
- Java Version: 17
- API Documentation: Springdoc OpenAPI (Swagger UI)

**Project Structure:**
- `Backend/` - Spring Boot application (port 8888)
- `Frontend/` - (Empty placeholder for future React + Ant Design frontend)
- `docs/` - Project planning and API documentation (Chinese)

## Core Domain Model

The system tracks energy consumption records for buildings through monitoring devices:

1. **Building** (`building` table) - Building information (code, type, name, area)
2. **MonitorDevice** (`monitor_device` table) - Monitoring equipment assigned to buildings
3. **EnergyRecord** (`energy_record` table) - Hourly energy consumption data including:
   - Electricity (kWh), water (m³), HVAC energy (kWh)
   - HVAC supply/return temperatures
   - Environmental data (temperature, humidity, occupancy density)

**Key Indexes:**
- `(building_id, record_time)` - Main query pattern
- `(device_id)`, `(record_time)`, `(device_status)` - Supporting indexes

## Architecture

**Package Structure:**
```
org.example.backend/
├── BackendApplication.java        # Main entry point
├── common/                         # Shared utilities
│   ├── ApiResponse.java           # Standardized API response wrapper
│   └── GlobalExceptionHandler.java # Centralized exception handling
├── controller/                     # REST API endpoints
│   ├── EnergyController.java      # Energy data CRUD + CSV import
│   ├── StatisticsController.java  # Analytics endpoints (time summaries, COP, anomalies)
│   └── ReportController.java      # Export functionality
├── service/                        # Business logic layer
├── repository/                     # Spring Data JPA repositories
├── entity/                         # JPA entities (Building, MonitorDevice, EnergyRecord)
└── dto/                           # Data transfer objects
    ├── EnergyRecordRequest.java   # Energy record creation/update
    ├── TimeSummaryDto.java        # Time-series aggregation results
    ├── CopDto.java                # Coefficient of Performance metrics
    └── AnomalyDto.java            # Anomaly detection results
```

**Key Design Patterns:**
- All repositories extend `JpaSpecificationExecutor<T>` for dynamic query building
- Services use `@Transactional` for data consistency
- Controllers use `ApiResponse<T>` wrapper for uniform response format
- Lombok's `@RequiredArgsConstructor` for dependency injection

## Common Development Commands

### Build and Run

```bash
# Navigate to Backend directory
cd Backend

# Build the project
mvn clean package

# Run the application
mvn spring-boot:run

# Run tests
mvn test

# Run a single test class
mvn test -Dtest=BackendApplicationTests
```

### Database Setup

The application uses `spring.jpa.hibernate.ddl-auto=update` which auto-creates tables. For manual initialization:

```bash
# Connect to PostgreSQL and run initialization script
psql -U postgres -d energy_mos -f Backend/src/main/resources/init_tables.sql
```

**Database Configuration:**
- Default URL: `jdbc:postgresql://localhost:5432/energy_mos`
- Default credentials: `postgres` / `123456`
- Connection settings in `Backend/src/main/resources/application.yml`

### API Documentation

After starting the application:
- Swagger UI: http://localhost:8888/swagger-ui.html
- OpenAPI JSON: http://localhost:8888/api-docs

## Key Features

### 1. Energy Data Management
- CRUD operations for energy records
- CSV file import with validation
- Multi-criteria filtering (building, device, time range, status)
- Paginated queries with sorting

### 2. Statistical Analysis (StatisticsController)
Three main analytics capabilities:

**Time-based Summaries** (`/api/statistics/time-summary`)
- Hourly/daily/monthly aggregation using SQL `date_trunc`
- Supports electricity, water, HVAC energy metrics

**COP Analysis** (`/api/statistics/cop`)
- Coefficient of Performance calculation: COP = Cooling Capacity / HVAC Energy
- Cooling capacity estimated from supply/return temperature differential

**Anomaly Detection** (`/api/statistics/anomalies`)
- Z-Score method: flags records >3σ from mean
- Comparison-based detection for period-over-period spikes

### 3. Report Export
- Excel/CSV export using Alibaba EasyExcel
- Streams data directly to `HttpServletResponse`

## Important Implementation Notes

### CSV Import Format
The `EnergyService.importCsv()` method expects specific column headers matching the database schema. Check Backend/src/main/java/org/example/backend/service/EnergyService.java for exact field mappings.

### Query Performance
- Use `EnergyRecordRepository.findByBuildingIdAndRecordTimeBetween()` for time-range queries (leverages composite index)
- The repository's `JpaSpecificationExecutor` enables dynamic `Specification<EnergyRecord>` building for complex filters

### Validation
- Uses `spring-boot-starter-validation` with Jakarta Validation annotations
- Global exception handling captures `MethodArgumentNotValidException`

## Planned Features (Not Yet Implemented)

Based on project documentation in docs/:
- Frontend React application with Ant Design + ECharts visualization
- Elasticsearch integration for knowledge base
- MCP (Model Context Protocol) server for LLM integration
- DeepSeek API integration for intelligent Q&A (RAG-based)
- Docker Compose orchestration
- Advanced anomaly detection algorithms

## Working with This Codebase

When making changes:
1. Follow existing package structure (controller → service → repository)
2. Use DTOs for API requests/responses (avoid exposing entities directly)
3. Leverage Spring Data JPA query methods or Specifications (avoid raw SQL unless necessary)
4. Add Swagger `@Operation` annotations to new endpoints
5. Maintain index strategy for new query patterns in `energy_record` table
6. Update `init_tables.sql` if schema changes are needed for fresh installations