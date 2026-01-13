# Junior-Dev-Challenge
A simple Relational Data Management System.

# SimpleDB - Relational Database Management System

A lightweight, in-memory RDBMS built from scratch in vanilla JavaScript with no external dependencies. SimpleDB demonstrates core database concepts including indexing, constraint enforcement, and SQL query processing.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [SQL Syntax Reference](#sql-syntax-reference)
- [Components](#components)
- [Data Types](#data-types)
- [Constraints](#constraints)
- [Indexing](#indexing)
- [Query Execution](#query-execution)
- [Demo Application](#demo-application)
- [Implementation](#implementation)
- [Limitations](#limitations)
- [Potential-For-Growth](#Potential-For-Growth)

## Features

✅ **Data Definition Language (DDL)**
- CREATE TABLE with multiple column types
- DROP TABLE support
- Column constraints (PRIMARY KEY, UNIQUE, NOT NULL)

✅ **Data Manipulation Language (DML)**
- INSERT: Add new rows to tables
- SELECT: Query data with optional WHERE clauses
- UPDATE: Modify existing rows
- DELETE: Remove rows from tables

✅ **Advanced Features**
- Automatic indexing on PRIMARY KEY and UNIQUE columns
- JOIN operations between tables
- Comparison operators in WHERE clauses (=, !=, <, >, <=, >=)
- Type validation and constraint enforcement

✅ **User Interface**
- Interactive SQL REPL for executing queries
- Live demo application (Task Manager)
- Comprehensive documentation

## Architecture Overview

SimpleDB follows a layered architecture:

```
┌─────────────────────────────────────┐
│         User Interface              │
│   (REPL, Demo App, Documentation)   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         SQL Parser Layer            │
│  (Parse SQL strings into operations)│
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Database Engine (SimpleDB)    │
│  (Execute operations, manage tables)│
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│        Storage Layer                │
│   (TableSchema, Indexes, Rows)      │
└─────────────────────────────────────┘
```

## Getting Started

### Installation

No installation required! Simply download the `simpledb.html` file and open it in any modern web browser.

```bash
# Option 1: Just open the file
open simpledb.html

# Option 2: Serve it locally (optional)
python -m http.server 8000
# Then navigate to http://localhost:8000/simpledb.html
```

### Quick Start Example

```sql
-- Create a table
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, age INTEGER)

-- Insert data
INSERT INTO users (id, name, age) VALUES (1, 'Alice', 30)
INSERT INTO users (id, name, age) VALUES (2, 'Bob', 25)

-- Query data
SELECT * FROM users

-- Update data
UPDATE users SET age = 31 WHERE name = 'Alice'

-- Delete data
DELETE FROM users WHERE age < 26
```

## SQL Syntax Reference

### CREATE TABLE

Create a new table with specified columns and constraints.

```sql
CREATE TABLE table_name (
    column1 datatype constraints,
    column2 datatype constraints,
    ...
)
```

**Example:**
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL,
    in_stock BOOLEAN
)
```

### INSERT INTO

Add new rows to a table.

```sql
INSERT INTO table_name (column1, column2, ...) VALUES (value1, value2, ...)
```

**Example:**
```sql
INSERT INTO products (id, name, price, in_stock) VALUES (1, 'Laptop', 999.99, true)
```

### SELECT

Retrieve data from a table.

```sql
SELECT column1, column2, ... FROM table_name WHERE condition
SELECT * FROM table_name
```

**Examples:**
```sql
SELECT * FROM products
SELECT name, price FROM products WHERE price > 500
SELECT * FROM products WHERE in_stock = true
```

### UPDATE

Modify existing rows in a table.

```sql
UPDATE table_name SET column1 = value1, column2 = value2 WHERE condition
```

**Example:**
```sql
UPDATE products SET price = 899.99, in_stock = false WHERE id = 1
```

### DELETE

Remove rows from a table.

```sql
DELETE FROM table_name WHERE condition
```

**Example:**
```sql
DELETE FROM products WHERE price < 100
```

### DROP TABLE

Remove a table and all its data.

```sql
DROP TABLE table_name
```

**Example:**
```sql
DROP TABLE products
```

### JOIN

Combine rows from two tables based on a related column.

```sql
SELECT columns FROM table1 JOIN table2 ON table1.column = table2.column
```

**Example:**
```sql
SELECT * FROM users JOIN orders ON users.id = orders.user_id
```

## Core Components

### 1. Column Class

Represents a table column with its data type and constraints.

```javascript
class Column {
    constructor(name, type, constraints = {})
    // Properties:
    // - name: Column name
    // - type: Data type (INTEGER, TEXT, REAL, BOOLEAN)
    // - primaryKey: Boolean
    // - unique: Boolean
    // - notNull: Boolean
}
```

### 2. Index Class

Implements indexing for fast lookups on PRIMARY KEY and UNIQUE columns.

```javascript
class Index {
    constructor(column)
    insert(value, rowIndex)    
    delete(value, rowIndex)    
    find(value)                
}
```

**Index Structure:**
- Uses JavaScript `Map` for O(1) average-case lookups
- Maps values to Sets of row IDs
- Automatically maintained on INSERT, UPDATE, DELETE operations

### 3. TableSchema Class

Manages table structure, data, and operations.

```javascript
class TableSchema {
    constructor(name, columns)
    
    insert(row)              
    select(condition, cols)  
    update(condition, updates) 
    delete(condition)        
    
    // Validation
    validateRow(row)        
}
```

### 4. SimpleDB Class

Main database engine that manages tables and executes SQL.

```javascript
class SimpleDB {
    constructor()
    
    // Table Management
    createTable(name, columns)
    dropTable(name)
    getTable(name)
    
    // SQL Execution
    executeSQL(sql)          // Parse and execute SQL statement
    
    // Internal Parsers
    parseColumns(columnsDef)
    parseValues(valueStr)
    parseWhere(whereClause)
    parseSet(setClause)
    performJoin(...)
}
```

## Data Types

SimpleDB supports four fundamental data types:

### INTEGER
Whole numbers (both positive and negative).

```sql
CREATE TABLE example (count INTEGER)
INSERT INTO example (count) VALUES (42)
INSERT INTO example (count) VALUES (-10)
```

**Validation:** Must be a valid JavaScript integer (`Number.isInteger()`)

### TEXT
String values of any length.

```sql
CREATE TABLE example (description TEXT)
INSERT INTO example (description) VALUES ('Hello, World!')
```

**Validation:** Must be a JavaScript string

### REAL
Floating-point numbers.

```sql
CREATE TABLE example (price REAL)
INSERT INTO example (price) VALUES (19.99)
INSERT INTO example (price) VALUES (3.14159)
```

**Validation:** Must be a JavaScript number

### BOOLEAN
True or false values.

```sql
CREATE TABLE example (active BOOLEAN)
INSERT INTO example (active) VALUES (true)
INSERT INTO example (active) VALUES (false)
```

**Validation:** Must be a JavaScript boolean

## Constraints

### PRIMARY KEY

Ensures each value in the column is unique and not null. A table can have only one primary key.

```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)
```

**Behavior:**
- Automatically creates an index for fast lookups
- Prevents duplicate values
- Prevents NULL values
- Enforced at INSERT and UPDATE time

### UNIQUE

Ensures all values in the column are unique (but allows NULL).

```sql
CREATE TABLE users (email TEXT UNIQUE)
```

**Behavior:**
- Automatically creates an index
- Prevents duplicate non-NULL values
- Multiple NULL values are allowed

### NOT NULL

Ensures the column cannot contain NULL values.

```sql
CREATE TABLE users (name TEXT NOT NULL)
```

**Behavior:**
- Enforced at INSERT and UPDATE time
- Throws error if NULL or undefined is provided

### Combining Constraints

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    bio TEXT
)
```

## Indexing

### How Indexing Works

SimpleDB automatically creates indexes for:
- PRIMARY KEY columns
- UNIQUE columns

**Index Structure:**
```
Index (Map-based)
├── value1 → Set { rowId1, rowId2 }
├── value2 → Set { rowId3 }
└── value3 → Set { rowId4, rowId5 }
```

### Performance Characteristics

| Operation | Without Index | With Index |
|-----------|---------------|------------|
| INSERT    | O(1)          | O(1)       |
| SELECT by indexed column | O(n) | O(1) avg |
| UPDATE    | O(n)          | O(1) avg   |
| DELETE    | O(n)          | O(1) avg   |
| SELECT without index | O(n) | O(n) |

### Index Maintenance

Indexes are automatically maintained:

```javascript
// INSERT: Add to index
table.insert({ id: 1, email: 'alice@example.com' })
// Index updated: email -> { rowId: 0 }

// UPDATE: Remove old value, add new value
table.update(row => row.id === 1, { email: 'newemail@example.com' })
// Index updated: removed 'alice@example.com', added 'newemail@example.com'

// DELETE: Remove from index
table.delete(row => row.id === 1)
// Index updated: removed 'newemail@example.com'
```

## Query Execution

### SELECT Execution Flow

```
1. Parse SQL → Extract table name, columns, WHERE clause
2. Get table reference from database
3. If WHERE clause exists, parse condition
4. Apply condition filter to rows
5. If specific columns requested, project only those columns
6. Return result set
```

**Example Execution:**
```sql
SELECT name, age FROM users WHERE age > 25
```

```javascript
// Step 1: Parse
table = 'users'
columns = ['name', 'age']
whereClause = 'age > 25'

// Step 2: Get table
const usersTable = db.getTable('users')

// Step 3: Parse condition
const condition = (row) => row.age > 25

// Step 4: Filter rows
const filtered = usersTable.rows.filter(condition)

// Step 5: Project columns
const result = filtered.map(row => ({
    name: row.name,
    age: row.age
}))

// Step 6: Return
return result
```

### WHERE Clause Parsing

SimpleDB supports comparison operators:

| Operator | Description | Example |
|----------|-------------|---------|
| =        | Equal       | WHERE age = 30 |
| !=       | Not equal   | WHERE status != 'inactive' |
| >        | Greater than | WHERE price > 100 |
| <        | Less than   | WHERE quantity < 10 |
| >=       | Greater or equal | WHERE score >= 90 |
| <=       | Less or equal | WHERE age <= 65 |

**Parser Implementation:**
```javascript
parseWhere(whereClause) {
    // Extract: column operator value
    const match = whereClause.match(/(\w+)\s*([=<>!]+)\s*(.+)/)
    const [, col, op, val] = match
    const value = this.parseValues(val)[0]
    
    // Return filter function
    return (row) => {
        switch (op) {
            case '=': return row[col] === value
            case '!=': return row[col] !== value
        }
    }
}
```

### JOIN Implementation

SimpleDB implements nested loop joins:

```javascript
performJoin(table1Name, table2Name, onClause) {
    // Get both tables
    const table1 = this.getTable(table1Name)
    const table2 = this.getTable(table2Name)
    
    // Parse ON clause: table1.col1 = table2.col2
    const [, t1, col1, t2, col2] = onClause.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/)
    
    // Nested loop join
    const results = []
    table1.rows.forEach(row1 => {
        table2.rows.forEach(row2 => {
            if (row1[col1] === row2[col2]) {
                results.push({ ...row1, ...row2 })
            }
        })
    })
    
    return results
}
```

**Time Complexity:** O(n × m) where n and m are table sizes

## Demo Application

The included Task Manager demonstrates real-world CRUD operations:

### Features
- ✅ Add new tasks
- ✅ Mark tasks as complete/incomplete
- ✅ Delete tasks
- ✅ Persist data in SimpleDB

### Database Schema

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
)

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    completed BOOLEAN
)
```

### Operations Used

```javascript
// CREATE
function addTask(title) {
    const id = Date.now()
    db.executeSQL(`INSERT INTO tasks (id, user_id, title, completed) 
                   VALUES (${id}, 1, '${title}', false)`)
}

// READ
function loadTasks() {
    return db.executeSQL('SELECT * FROM tasks')
}

// UPDATE
function toggleTask(id, completed) {
    db.executeSQL(`UPDATE tasks SET completed = ${!completed} 
                   WHERE id = ${id}`)
}

// DELETE
function deleteTask(id) {
    db.executeSQL(`DELETE FROM tasks WHERE id = ${id}`)
}
```

## Implementation Details

### Storage Model

SimpleDB uses in-memory storage with the following structure:

```javascript
{
    tables: Map {
        'users' => TableSchema {
            name: 'users',
            columns: [Column, Column, ...],
            rows: [
                { _rowid: 0, id: 1, name: 'Alice', email: 'alice@example.com' },
                { _rowid: 1, id: 2, name: 'Bob', email: 'bob@example.com' }
            ],
            indexes: Map {
                'id' => Index { map: Map { 1 => Set{0}, 2 => Set{1} } },
                'email' => Index { map: Map { 'alice@...' => Set{0}, 'bob@...' => Set{1} } }
            },
            nextRowId: 2
        },
        'tasks' => TableSchema { ... }
    }
}
```

### Row ID Management

Each row gets an internal `_rowid` for tracking:

```javascript
insert(row) {
    const rowWithId = { 
        _rowid: this.nextRowId++, 
        ...row 
    }
    this.rows.push(rowWithId)
}
```

The `_rowid` is:
- Hidden from query results
- Used internally for index lookups
- Monotonically increasing
- Unique per table

### Type Validation

Type checking happens at INSERT and UPDATE:

```javascript
validateRow(row) {
    for (let col of this.columns) {
        const value = row[col.name]
        
        switch (col.type) {
            case 'INTEGER':
                if (!Number.isInteger(value)) 
                    throw new Error(`${col.name} must be INTEGER`)
                break
            case 'TEXT':
                if (typeof value !== 'string') 
                    throw new Error(`${col.name} must be TEXT`)
                break

        }
    }
}
```

### Constraint Enforcement

Constraints are checked before any write operation:

```javascript
if (col.notNull && (value === null || value === undefined)) {
    throw new Error(`Column ${col.name} cannot be NULL`)
}

if ((col.unique || col.primaryKey) && value !== null) {
    const existing = this.indexes.get(col.name).find(value)
    if (existing.size > 0) {
        throw new Error(`Duplicate value for ${col.name}`)
    }
}
```

### SQL Parser Strategy

SimpleDB uses regex-based parsing:

```javascript
executeSQL(sql) {
    const createMatch = sql.match(/CREATE TABLE (\w+)\s*\((.*)\)/i)
    if (createMatch) { /* handle CREATE */ }
    
    const insertMatch = sql.match(/INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i)
    if (insertMatch) { /* handle INSERT */ }

    throw new Error('Invalid SQL syntax')
}
```

**Trade-offs:**
- ✅ Simple to implement
- ✅ No external parser dependencies
- ❌ Limited to simple SQL patterns
- ❌ Cannot handle complex nested queries

## Limitations

### Current Limitations

1. **No Persistence**: Data is stored in memory only. Closing the browser loses all data.

2. **Limited SQL Support**: 
   - No nested queries or subqueries
   - No aggregate functions (COUNT, SUM, AVG, etc.)
   - No GROUP BY or HAVING
   - No ORDER BY or LIMIT
   - Single-column WHERE conditions only

3. **Basic JOIN**: Only supports simple INNER JOIN on equality conditions

4. **No Transactions**: No ACID guarantees, no rollback support

5. **No Concurrency Control**: Single-threaded execution only

6. **Limited Indexing**: Only hash-based indexes on PRIMARY KEY and UNIQUE columns

7. **No Foreign Keys**: No referential integrity constraints

8. **Value Parsing**: String escaping is basic (no support for embedded quotes)

### Known Issues

- JOIN queries don't support WHERE clauses
- Cannot combine multiple constraints in WHERE (no AND/OR)
- No NULL-safe equality operators

## Future Enhancements

### Potential Improvements

#### 1. Persistence Layer
```javascript
class PersistentDB extends SimpleDB {
    save() {
        localStorage.setItem('simpledb', JSON.stringify(this.serialize()))
    }
    
    load() {
        const data = JSON.parse(localStorage.getItem('simpledb'))
        this.deserialize(data)
    }
}
```

#### 2. Advanced Indexing
- B-tree indexes for range queries
- Composite indexes (multi-column)
- Full-text search indexes

#### 3. Query Optimization
- Query planner
- Cost-based optimization
- Index selection hints

#### 4. Extended SQL Support
```sql
-- Aggregate functions
SELECT COUNT(*), AVG(price) FROM products

-- GROUP BY
SELECT category, COUNT(*) FROM products GROUP BY category

-- ORDER BY and LIMIT
SELECT * FROM products ORDER BY price DESC LIMIT 10

-- Subqueries
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)
```

#### 5. Transactions
```javascript
db.beginTransaction()
try {
    db.executeSQL('INSERT INTO accounts ...')
    db.executeSQL('UPDATE accounts ...')
    db.commit()
} catch (e) {
    db.rollback()
}
```

#### 6. Foreign Keys
```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER FOREIGN KEY REFERENCES users(id)
)
```

#### 7. Views
```sql
CREATE VIEW active_users AS 
SELECT * FROM users WHERE status = 'active'
```

#### 8. Performance Monitoring
```javascript
db.explain('SELECT * FROM users WHERE age > 25')

## Performance Benchmarks

Approximate performance on modern browsers:

| Operation | Rows | Time |
|-----------|------|------|
| CREATE TABLE | 1 | <1ms |
| INSERT | 1,000 | ~50ms |
| SELECT * | 10,000 | ~10ms |
| SELECT with WHERE (indexed) | 10,000 | ~5ms |
| SELECT with WHERE (no index) | 10,000 | ~15ms |
| UPDATE (indexed) | 100 of 10,000 | ~8ms |
| DELETE (indexed) | 100 of 10,000 | ~6ms |
| JOIN | 1,000 × 1,000 | ~200ms |

*Benchmarks are approximate and depend on hardware/browser*

## Contributing

This is an educational project. Potential areas for contribution:

1. **Testing**: Add comprehensive test suite
2. **Documentation**: Improve code comments and examples
3. **Features**: Implement missing SQL features
4. **Performance**: Optimize query execution
5. **UI**: Enhance the interface with visualizations

## License
GNU - General Public License

## Acknowledgments
Built from scratch as a demonstration of:
- Database internals and architecture
- SQL parsing and execution
- Data structures (hash maps, sets)
- Constraint enforcement and validation
- Web-based interactive applications
