        class Column {
            constructor(name, type, constraints = {}) {
                this.name = name;
                this.type = type;
                this.primaryKey = constraints.primaryKey || false;
                this.unique = constraints.unique || false;
                this.notNull = constraints.notNull || false;
            }
        }

        class Index {
            constructor(column) {
                this.column = column;
                this.map = new Map();
            }

            insert(value, rowIndex) {
                if (!this.map.has(value)) {
                    this.map.set(value, new Set());
                }
                this.map.get(value).add(rowIndex);
            }

            delete(value, rowIndex) {
                if (this.map.has(value)) {
                    this.map.get(value).delete(rowIndex);
                    if (this.map.get(value).size === 0) {
                        this.map.delete(value);
                    }
                }
            }

            find(value) {
                return this.map.get(value) || new Set();
            }
        }

        class TableSchema {
            constructor(name, columns) {
                this.name = name;
                this.columns = columns;
                this.rows = [];
                this.indexes = new Map();
                this.nextRowId = 0;
                
                columns.forEach(col => {
                    if (col.primaryKey || col.unique) {
                        this.indexes.set(col.name, new Index(col.name));
                    }
                });
            }

            validateRow(row) {
                for (let col of this.columns) {
                    const value = row[col.name];
                    
                    if (col.notNull && (value === null || value === undefined)) {
                        throw new Error(`Column ${col.name} cannot be NULL`);
                    }
                    
                    if (value !== null && value !== undefined) {
                        switch (col.type) {
                            case 'INTEGER':
                                if (!Number.isInteger(value)) throw new Error(`${col.name} must be INTEGER`);
                                break;
                            case 'REAL':
                                if (typeof value !== 'number') throw new Error(`${col.name} must be REAL`);
                                break;
                            case 'TEXT':
                                if (typeof value !== 'string') throw new Error(`${col.name} must be TEXT`);
                                break;
                            case 'BOOLEAN':
                                if (typeof value !== 'boolean') throw new Error(`${col.name} must be BOOLEAN`);
                                break;
                        }
                    }
                    
                    if ((col.unique || col.primaryKey) && value !== null && value !== undefined) {
                        const existing = this.indexes.get(col.name).find(value);
                        if (existing.size > 0) {
                            throw new Error(`Duplicate value for ${col.primaryKey ? 'PRIMARY KEY' : 'UNIQUE'} column ${col.name}`);
                        }
                    }
                }
            }

            insert(row) {
                this.validateRow(row);
                const rowWithId = { _rowid: this.nextRowId++, ...row };
                
                this.columns.forEach(col => {
                    if (this.indexes.has(col.name)) {
                        this.indexes.get(col.name).insert(row[col.name], rowWithId._rowid);
                    }
                });
                
                this.rows.push(rowWithId);
                return rowWithId;
            }

            update(condition, updates) {
                const rowsToUpdate = this.select(condition);
                let count = 0;
                
                rowsToUpdate.forEach(row => {
                    this.columns.forEach(col => {
                        if (this.indexes.has(col.name)) {
                            this.indexes.get(col.name).delete(row[col.name], row._rowid);
                        }
                    });
                    
                    Object.assign(row, updates);
                    this.validateRow(row);
                    
                    this.columns.forEach(col => {
                        if (this.indexes.has(col.name)) {
                            this.indexes.get(col.name).insert(row[col.name], row._rowid);
                        }
                    });
                    
                    count++;
                });
                
                return count;
            }

            delete(condition) {
                const rowsToDelete = this.select(condition);
                let count = 0;
                
                rowsToDelete.forEach(row => {
                    this.columns.forEach(col => {
                        if (this.indexes.has(col.name)) {
                            this.indexes.get(col.name).delete(row[col.name], row._rowid);
                        }
                    });
                    
                    const index = this.rows.findIndex(r => r._rowid === row._rowid);
                    if (index > -1) {
                        this.rows.splice(index, 1);
                        count++;
                    }
                });
                
                return count;
            }

            select(condition = null, columns = null) {
                let results = [...this.rows];
                
                if (condition) {
                    results = results.filter(condition);
                }
                
                if (columns) {
                    results = results.map(row => {
                        const filtered = {};
                        columns.forEach(col => {
                            filtered[col] = row[col];
                        });
                        return filtered;
                    });
                }
                
                return results;
            }
        }

        class SimpleDB {
            constructor() {
                this.tables = new Map();
            }

            createTable(name, columns) {
                if (this.tables.has(name)) {
                    throw new Error(`Table ${name} already exists`);
                }
                this.tables.set(name, new TableSchema(name, columns));
                return `Table ${name} created`;
            }

            dropTable(name) {
                if (!this.tables.has(name)) {
                    throw new Error(`Table ${name} does not exist`);
                }
                this.tables.delete(name);
                return `Table ${name} dropped`;
            }

            getTable(name) {
                const table = this.tables.get(name);
                if (!table) throw new Error(`Table ${name} does not exist`);
                return table;
            }

            executeSQL(sql) {
                sql = sql.trim();
                
                const createMatch = sql.match(/CREATE TABLE (\w+)\s*\((.*)\)/i);
                if (createMatch) {
                    const [, tableName, columnsDef] = createMatch;
                    const columns = this.parseColumns(columnsDef);
                    return this.createTable(tableName, columns);
                }
                
                const insertMatch = sql.match(/INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
                if (insertMatch) {
                    const [, tableName, columnNames, values] = insertMatch;
                    const table = this.getTable(tableName);
                    const cols = columnNames.split(',').map(c => c.trim());
                    const vals = this.parseValues(values);
                    
                    const row = {};
                    cols.forEach((col, i) => {
                        row[col] = vals[i];
                    });
                    
                    table.insert(row);
                    return `1 row inserted into ${tableName}`;
                }
                
                const selectMatch = sql.match(/SELECT (.*?) FROM (\w+)(?:\s+WHERE\s+(.*))?/i);
                if (selectMatch) {
                    const [, columns, tableName, whereClause] = selectMatch;
                    const table = this.getTable(tableName);
                    const cols = columns.trim() === '*' ? null : columns.split(',').map(c => c.trim());
                    const condition = whereClause ? this.parseWhere(whereClause) : null;
                    
                    return table.select(condition, cols);
                }
                
                const updateMatch = sql.match(/UPDATE (\w+) SET (.*?)(?:\s+WHERE\s+(.*))?/i);
                if (updateMatch) {
                    const [, tableName, setClause, whereClause] = updateMatch;
                    const table = this.getTable(tableName);
                    const updates = this.parseSet(setClause);
                    const condition = whereClause ? this.parseWhere(whereClause) : null;
                    
                    const count = table.update(condition, updates);
                    return `${count} row(s) updated`;
                }
                
                const deleteMatch = sql.match(/DELETE FROM (\w+)(?:\s+WHERE\s+(.*))?/i);
                if (deleteMatch) {
                    const [, tableName, whereClause] = deleteMatch;
                    const table = this.getTable(tableName);
                    const condition = whereClause ? this.parseWhere(whereClause) : null;
                    
                    const count = table.delete(condition);
                    return `${count} row(s) deleted`;
                }
                
                const dropMatch = sql.match(/DROP TABLE (\w+)/i);
                if (dropMatch) {
                    const [, tableName] = dropMatch;
                    return this.dropTable(tableName);
                }
                
                const joinMatch = sql.match(/SELECT (.*?) FROM (\w+) JOIN (\w+) ON (.*)/i);
                if (joinMatch) {
                    const [, columns, table1Name, table2Name, onClause] = joinMatch;
                    return this.performJoin(table1Name, table2Name, onClause, columns);
                }
                
                throw new Error('Invalid SQL syntax');
            }

            parseColumns(columnsDef) {
                return columnsDef.split(',').map(colDef => {
                    const parts = colDef.trim().split(/\s+/);
                    const name = parts[0];
                    const type = parts[1];
                    const constraints = {
                        primaryKey: colDef.includes('PRIMARY KEY'),
                        unique: colDef.includes('UNIQUE'),
                        notNull: colDef.includes('NOT NULL')
                    };
                    return new Column(name, type, constraints);
                });
            }

            parseValues(valueStr) {
                return valueStr.split(',').map(v => {
                    v = v.trim();
                    if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
                    if (v === 'true') return true;
                    if (v === 'false') return false;
                    if (v === 'null') return null;
                    return isNaN(v) ? v : (v.includes('.') ? parseFloat(v) : parseInt(v));
                });
            }

            parseSet(setClause) {
                const updates = {};
                setClause.split(',').forEach(pair => {
                    const [col, val] = pair.split('=').map(s => s.trim());
                    updates[col] = this.parseValues(val)[0];
                });
                return updates;
            }

            parseWhere(whereClause) {
                const match = whereClause.match(/(\w+)\s*([=<>!]+)\s*(.+)/);
                if (!match) return null;
                
                const [, col, op, val] = match;
                const value = this.parseValues(val)[0];
                
                return (row) => {
                    switch (op) {
                        case '=': return row[col] === value;
                        case '!=': return row[col] !== value;
                        case '>': return row[col] > value;
                        case '<': return row[col] < value;
                        case '>=': return row[col] >= value;
                        case '<=': return row[col] <= value;
                        default: return true;
                    }
                };
            }

            performJoin(table1Name, table2Name, onClause, columns) {
                const table1 = this.getTable(table1Name);
                const table2 = this.getTable(table2Name);
                
                const match = onClause.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
                if (!match) throw new Error('Invalid JOIN syntax');
                
                const [, t1, col1, t2, col2] = match;
                const results = [];
                
                table1.rows.forEach(row1 => {
                    table2.rows.forEach(row2 => {
                        if (row1[col1] === row2[col2]) {
                            const joined = { ...row1, ...row2 };
                            results.push(joined);
                        }
                    });
                });
                
                return results;
            }
        }

        const db = new SimpleDB();

        try {
            db.executeSQL('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE)');
            db.executeSQL('CREATE TABLE tasks (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT NOT NULL, completed BOOLEAN)');
            db.executeSQL("INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com')");
            db.executeSQL("INSERT INTO users (id, name, email) VALUES (2, 'Bob', 'bob@example.com')");
        } catch (e) {
            console.error('Init error:', e);
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName + '-panel').classList.add('active');
            
            if (tabName === 'demo') {
                loadTasks();
            }
        }

        function executeSQL() {
            const input = document.getElementById('sql-input');
            const sql = input.value.trim();
            if (!sql) return;
            
            try {
                const result = db.executeSQL(sql);
                addToHistory(sql, result, false);
                input.value = '';
                
                if (sql.toLowerCase().includes('tasks')) {
                    loadTasks();
                }
            } catch (e) {
                addToHistory(sql, e.message, true);
            }
        }

        function addToHistory(sql, result, isError) {
            const history = document.getElementById('history');
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const sqlDiv = document.createElement('div');
            sqlDiv.className = 'history-sql';
            sqlDiv.innerHTML = `<span class="sql-prompt">sql&gt;</span> ${sql}`;
            
            const resultDiv = document.createElement('div');
            resultDiv.className = isError ? 'result-error' : '';
            
            if (typeof result === 'string') {
                resultDiv.innerHTML = `<span class="${isError ? 'result-error' : 'result-success'}">${result}</span>`;
            } else if (Array.isArray(result)) {
                if (result.length === 0) {
                    resultDiv.innerHTML = '<span style="color: #6b7280;">0 rows returned</span>';
                } else {
                    const table = createTable(result);
                    resultDiv.appendChild(table);
                    const count = document.createElement('div');
                    count.className = 'row-count';
                    count.textContent = `${result.length} row(s) returned`;
                    resultDiv.appendChild(count);
                }
            }
            
            item.appendChild(sqlDiv);
            item.appendChild(resultDiv);
            history.insertBefore(item, history.firstChild);
        }

        function createTable(data) {
            const table = document.createElement('table');
            const keys = Object.keys(data[0]).filter(k => k !== '_rowid');
            
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            keys.forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            data.forEach(row => {
                const tr = document.createElement('tr');
                keys.forEach(key => {
                    const td = document.createElement('td');
                    td.textContent = String(row[key]);
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            
            return table;
        }

        function loadTasks() {
            try {
                const result = db.executeSQL('SELECT * FROM tasks');
                const taskList = document.getElementById('task-list');
                taskList.innerHTML = '';
                
                if (result.length === 0) {
                    taskList.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
                    return;
                }
                
                result.forEach(task => {
                    const item = document.createElement('div');
                    item.className = 'task-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'task-checkbox';
                    checkbox.checked = task.completed;
                    checkbox.onchange = () => toggleTask(task.id);
                    
                    const title = document.createElement('span');
                    title.className = 'task-title' + (task.completed ? ' task-completed' : '');
                    title.textContent = task.title;
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn-danger';
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.onclick = () => deleteTask(task.id);
                    
                    item.appendChild(checkbox);
                    item.appendChild(title);
                    item.appendChild(deleteBtn);
                    taskList.appendChild(item);
                });
            } catch (e) {
                console.error('Load tasks error:', e);
            }
        }

        function addTask() {
            const input = document.getElementById('task-input');
            const title = input.value.trim();
            if (!title) return;
            
            try {
                const id = Date.now();
                db.executeSQL(`INSERT INTO tasks (id, user_id, title, completed) VALUES (${id}, 1, '${title}', false)`);
                input.value = '';
                loadTasks();
            } catch (e) {
                alert('Error adding task: ' + e.message);
            }
        }

        function toggleTask(id) {
            try {
                const result = db.executeSQL('SELECT * FROM tasks');
                const task = result.find(t => t.id === id);
                db.executeSQL(`UPDATE tasks SET completed = ${!task.completed} WHERE id = ${id}`);
                loadTasks();
            } catch (e) {
                alert('Error updating task: ' + e.message);
            }
        }

        function deleteTask(id) {
            try {
                db.executeSQL(`DELETE FROM tasks WHERE id = ${id}`);
                loadTasks();
            } catch (e) {
                alert('Error deleting task: ' + e.message);
            }
        }

        document.getElementById('sql-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeSQL();
        });

        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });