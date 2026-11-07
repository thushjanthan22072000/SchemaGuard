/* =========================================================
   SMARTSCHEMA
   Smart Database Schema Smell Detection System
   Frontend JavaScript Engine
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let database = {
    tables: [],
    foreignKeys: [],
    smells: [],
    health: 0
};


/* =========================================================
   SAMPLE SQL
========================================================= */

const sampleSQL = `
CREATE TABLE Student (
    StudentID INT,
    StudentName VARCHAR(100),
    Email VARCHAR(100),
    Phone1 VARCHAR(20),
    Phone2 VARCHAR(20),
    Course1 VARCHAR(100),
    Course2 VARCHAR(100),
    DepartmentID INT
);

CREATE TABLE Department (
    DepartmentID INT PRIMARY KEY,
    DepartmentName VARCHAR(100)
);

CREATE TABLE Enrollment (
    EnrollmentID INT PRIMARY KEY,
    StudentID INT,
    CourseID INT,
    EnrollmentDate DATE,
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
);
`;


/* =========================================================
   NAVIGATION
========================================================= */

document.querySelectorAll(".nav-btn").forEach(button => {

    button.addEventListener("click", () => {

        const section = button.dataset.section;

        showSection(section);

    });

});


function showSection(sectionName) {

    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    const target = document.getElementById(sectionName);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const activeButton =
        document.querySelector(`[data-section="${sectionName}"]`);

    if (activeButton) {
        activeButton.classList.add("active");
    }

    const titles = {

        dashboard: [
            "Database Dashboard",
            "Analyze, visualize and improve your database schema."
        ],

        analyzer: [
            "SQL Schema Analyzer",
            "Parse and inspect your database structure."
        ],

        diagram: [
            "Entity Relationship Diagram",
            "Visual representation of your database."
        ],

        smells: [
            "Schema Smell Detection",
            "Identify problems in database design."
        ],

        normalization: [
            "Normalization Analyzer",
            "Analyze normalization quality."
        ],

        dependencies: [
            "Functional Dependency Analyzer",
            "Analyze closures and candidate keys."
        ],

        query: [
            "SQL Query Advisor",
            "Find common SQL query optimization opportunities."
        ],

        optimizer: [
            "Fix My Schema",
            "Generate recommendations for improving the design."
        ],

        sqloutput: [
            "Generated SQL",
            "SQL generated from your analyzed schema."
        ]

    };

    if (titles[sectionName]) {

        document.getElementById("pageTitle").textContent =
            titles[sectionName][0];

        document.getElementById("pageDescription").textContent =
            titles[sectionName][1];

    }

}


/* =========================================================
   SAMPLE
========================================================= */

function loadSample() {

    document.getElementById("sqlInput").value = sampleSQL;

    showToast("Sample database loaded");

    showSection("analyzer");
}


/* =========================================================
   CLEAR
========================================================= */

function clearSQL() {

    document.getElementById("sqlInput").value = "";

    database = {
        tables: [],
        foreignKeys: [],
        smells: [],
        health: 0
    };

    updateDashboard();

    showToast("SQL cleared");

}


/* =========================================================
   MAIN ANALYZER
========================================================= */

function analyzeSchema() {

    const sql =
        document.getElementById("sqlInput").value.trim();

    if (!sql) {

        showToast("Please enter SQL schema first");

        showSection("analyzer");

        return;
    }


    database.tables = parseSQL(sql);

    database.foreignKeys =
        extractForeignKeys(sql);

    database.smells =
        detectSmells(database.tables, database.foreignKeys);

    database.health =
        calculateHealth(database.tables, database.smells);


    updateDashboard();

    renderSchemaTables();

    renderSmells();

    renderERDiagram();

    analyzeNormalization();

    generateSQL();

    generateOptimization();

    showToast(
        `${database.tables.length} table(s) analyzed successfully`
    );

}


/* =========================================================
   SQL PARSER
========================================================= */

function parseSQL(sql) {

    const tables = [];

    const tableRegex =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)\s*;/gi;

    let match;

    while ((match = tableRegex.exec(sql)) !== null) {

        const tableName = match[1];

        const body = match[2];

        const definitions = splitDefinitions(body);

        const columns = [];

        const tablePrimaryKeys = [];

        definitions.forEach(def => {

            const clean = def.trim();

            if (!clean) return;


            /* PRIMARY KEY (...) */

            const tablePK =
                clean.match(
                    /PRIMARY\s+KEY\s*\(([^)]+)\)/i
                );

            if (tablePK) {

                tablePK[1]
                    .split(",")
                    .forEach(pk => {

                        tablePrimaryKeys.push(
                            pk.trim().replace(/[`"']/g, "")
                        );

                    });

                return;
            }


            /* FOREIGN KEY */

            if (/FOREIGN\s+KEY/i.test(clean)) {
                return;
            }


            /* CONSTRAINT */

            if (/^CONSTRAINT/i.test(clean)) {
                return;
            }


            /* Column */

            const columnMatch =
                clean.match(
                    /^[`"']?(\w+)[`"']?\s+([A-Za-z]+(?:\s*\([^)]*\))?(?:\s+[A-Za-z]+)?)/i
                );

            if (!columnMatch) return;


            const name = columnMatch[1];

            const type = columnMatch[2];


            const isPrimary =
                /PRIMARY\s+KEY/i.test(clean);

            const isUnique =
                /UNIQUE/i.test(clean);

            const isNotNull =
                /NOT\s+NULL/i.test(clean);


            columns.push({

                name,
                type,

                primaryKey: isPrimary,
                unique: isUnique,
                notNull: isNotNull

            });

        });


        /* Apply table-level PK */

        columns.forEach(column => {

            if (tablePrimaryKeys.includes(column.name)) {

                column.primaryKey = true;

            }

        });


        tables.push({

            name: tableName,
            columns

        });

    }

    return tables;
}


/* =========================================================
   SPLIT SQL DEFINITIONS
========================================================= */

function splitDefinitions(body) {

    const result = [];

    let current = "";

    let depth = 0;

    for (let char of body) {

        if (char === "(") depth++;

        if (char === ")") depth--;

        if (char === "," && depth === 0) {

            result.push(current);

            current = "";

        } else {

            current += char;

        }

    }

    if (current.trim()) {
        result.push(current);
    }

    return result;
}


/* =========================================================
   FOREIGN KEY EXTRACTION
========================================================= */

function extractForeignKeys(sql) {

    const foreignKeys = [];

    const regex =
        /(?:FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s*REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\))/gi;

    let match;

    while ((match = regex.exec(sql)) !== null) {

        foreignKeys.push({

            column: match[1],

            referencedTable: match[2],

            referencedColumn: match[3]

        });

    }

    return foreignKeys;
}


/* =========================================================
   SMELL DETECTOR
========================================================= */

function detectSmells(tables, foreignKeys) {

    const smells = [];


    tables.forEach(table => {


        /* Missing PK */

        const hasPK =
            table.columns.some(c => c.primaryKey);

        if (!hasPK) {

            smells.push({

                type: "Missing Primary Key",

                severity: "critical",

                table: table.name,

                description:
                    `Table "${table.name}" does not define a primary key.`,

                recommendation:
                    "Identify a stable identifier and define it as PRIMARY KEY."

            });

        }


        /* Wide table */

        if (table.columns.length >= 12) {

            smells.push({

                type: "Wide Table",

                severity: "warning",

                table: table.name,

                description:
                    `"${table.name}" contains ${table.columns.length} columns.`,

                recommendation:
                    "Consider decomposing the table into smaller related entities."

            });

        }


        /* Repeating groups */

        const repeating =
            detectRepeatingGroups(table.columns);

        if (repeating.length > 0) {

            smells.push({

                type: "Repeating Group",

                severity: "warning",

                table: table.name,

                description:
                    `Possible repeating attributes: ${repeating.join(", ")}.`,

                recommendation:
                    "Move repeated attributes into a separate related table."

            });

        }


        /* Duplicate-like columns */

        const names =
            table.columns.map(c =>
                normalizeName(c.name)
            );

        const duplicates = [];

        for (let i = 0; i < names.length; i++) {

            for (let j = i + 1; j < names.length; j++) {

                if (
                    names[i] === names[j] &&
                    table.columns[i].name !== table.columns[j].name
                ) {

                    duplicates.push(
                        `${table.columns[i].name} / ${table.columns[j].name}`
                    );

                }

            }

        }

        if (duplicates.length) {

            smells.push({

                type: "Possible Duplicate Columns",

                severity: "suggestion",

                table: table.name,

                description:
                    `Similar attributes detected: ${duplicates.join(", ")}.`,

                recommendation:
                    "Review whether these attributes represent the same concept."

            });

        }


        /* Naming */

        const badNames =
            table.columns
                .filter(c =>
                    /[\s-]/.test(c.name) ||
                    /^[A-Z]+$/.test(c.name)
                )
                .map(c => c.name);

        if (badNames.length) {

            smells.push({

                type: "Naming Inconsistency",

                severity: "suggestion",

                table: table.name,

                description:
                    `Potentially inconsistent names: ${badNames.join(", ")}.`,

                recommendation:
                    "Use one consistent naming convention."

            });

        }


        /* Phone / Course repetition */

        const lowerNames =
            table.columns.map(c =>
                c.name.toLowerCase()
            );

        const phoneColumns =
            lowerNames.filter(n =>
                /^phone\d+$/.test(n)
            );

        if (phoneColumns.length >= 2) {

            smells.push({

                type: "Multi-Valued Attribute",

                severity: "warning",

                table: table.name,

                description:
                    "Multiple phone-number columns were detected.",

                recommendation:
                    "Create a separate phone/contact table."

            });

        }

    });


    /* No FK relationship */

    if (tables.length > 1 && foreignKeys.length === 0) {

        smells.push({

            type: "Missing Relationships",

            severity: "warning",

            table: "Database",

            description:
                "Multiple tables exist but no foreign-key relationship was detected.",

            recommendation:
                "Review relationships between entities and add appropriate foreign keys."

        });

    }


    return smells;
}


/* =========================================================
   REPEATING GROUP DETECTOR
========================================================= */

function detectRepeatingGroups(columns) {

    const found = [];

    const names =
        columns.map(c => c.name);

    names.forEach(name => {

        const match =
            name.match(/^(.+?)(\d+)$/);

        if (!match) return;

        const prefix = match[1];

        const existsAnother =
            names.some(other =>
                other !== name &&
                other.match(
                    new RegExp(
                        "^" +
                        escapeRegex(prefix) +
                        "\\d+$",
                        "i"
                    )
                )
            );

        if (existsAnother) {

            found.push(name);

        }

    });

    return [...new Set(found)];
}


/* =========================================================
   NORMALIZE NAME
========================================================= */

function normalizeName(name) {

    return name
        .toLowerCase()
        .replace(/[_\-\s]/g, "")
        .replace(/\d+$/, "");

}


/* =========================================================
   HEALTH SCORE
========================================================= */

function calculateHealth(tables, smells) {

    if (!tables.length) return 0;


    let score = 100;


    smells.forEach(smell => {

        if (smell.severity === "critical") {

            score -= 12;

        } else if (smell.severity === "warning") {

            score -= 7;

        } else {

            score -= 3;

        }

    });


    /* Reward good PK coverage */

    const pkTables =
        tables.filter(table =>
            table.columns.some(c => c.primaryKey)
        ).length;

    if (pkTables === tables.length) {

        score += 5;

    }


    return Math.max(
        0,
        Math.min(100, score)
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const tables = database.tables;

    const columns =
        tables.reduce(
            (sum, table) =>
                sum + table.columns.length,
            0
        );

    const pks =
        tables.reduce(
            (sum, table) =>
                sum +
                table.columns.filter(c =>
                    c.primaryKey
                ).length,
            0
        );

    const critical =
        database.smells.filter(
            s => s.severity === "critical"
        ).length;

    const warning =
        database.smells.filter(
            s => s.severity === "warning"
        ).length;


    setText("tableCount", tables.length);

    setText("columnCount", columns);

    setText("pkCount", pks);

    setText(
        "fkCount",
        database.foreignKeys.length
    );

    setText("criticalCount", critical);

    setText("warningCount", warning);

    setText(
        "healthScore",
        database.health
    );


    /* Health bars */

    const pkHealth =
        tables.length
            ? Math.round(
                (tables.filter(t =>
                    t.columns.some(c =>
                        c.primaryKey
                    )
                ).length / tables.length) * 100
            )
            : 0;


    const fkHealth =
        tables.length > 1
            ? Math.min(
                100,
                database.foreignKeys.length /
                (tables.length - 1) * 100
            )
            : 100;


    const normalHealth =
        database.smells.some(
            s => s.type === "Repeating Group"
        )
            ? 50
            : 90;


    const nameHealth =
        database.smells.some(
            s => s.type === "Naming Inconsistency"
        )
            ? 65
            : 95;


    updateBar("pk", pkHealth);

    updateBar("fk", Math.round(fkHealth));

    updateBar("normal", normalHealth);

    updateBar("name", nameHealth);


    renderRecentProblems();

}


/* =========================================================
   BAR UPDATE
========================================================= */

function updateBar(prefix, value) {

    setText(
        prefix + "Health",
        value + "%"
    );

    const bar =
        document.getElementById(
            prefix + "Bar"
        );

    if (bar) {
        bar.style.width = value + "%";
    }

}


/* =========================================================
   SCHEMA TABLES
========================================================= */

function renderSchemaTables() {

    const container =
        document.getElementById("schemaTables");


    if (!database.tables.length) {

        container.innerHTML =
            `<div class="empty">
                No tables detected.
             </div>`;

        return;
    }


    container.innerHTML =
        database.tables.map(table => {

            return `
                <div class="schema-table">

                    <div class="schema-table-header">
                        🗃 ${escapeHTML(table.name)}
                    </div>

                    ${table.columns.map(column => `

                        <div class="schema-column">

                            <span>
                                ${column.primaryKey ? "🔑 " : ""}
                                ${escapeHTML(column.name)}

                                ${
                                    column.primaryKey
                                    ? `<span class="key-badge">PK</span>`
                                    : ""
                                }

                            </span>

                            <span class="column-type">
                                ${escapeHTML(column.type)}
                            </span>

                        </div>

                    `).join("")}

                </div>
            `;

        }).join("");

}


/* =========================================================
   SMELL RENDER
========================================================= */

function renderSmells() {

    const list =
        document.getElementById("smellList");


    const critical =
        database.smells.filter(
            s => s.severity === "critical"
        ).length;

    const warning =
        database.smells.filter(
            s => s.severity === "warning"
        ).length;

    const suggestion =
        database.smells.filter(
            s => s.severity === "suggestion"
        ).length;


    setText("smellCritical", critical);

    setText("smellWarning", warning);

    setText("smellSuggestion", suggestion);

    setText(
        "smellPassed",
        Math.max(
            0,
            database.tables.length * 3 -
            database.smells.length
        )
    );


    if (!database.smells.length) {

        list.innerHTML = `
            <div class="smell-item">

                <div class="smell-top">

                    <span class="smell-title">
                        ✓ No major smells detected
                    </span>

                    <span class="severity good">
                        PASSED
                    </span>

                </div>

                <p>
                    Your schema passed the implemented
                    frontend design checks.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        database.smells.map(smell => `

            <div class="smell-item">

                <div class="smell-top">

                    <span class="smell-title">
                        ${iconForSeverity(smell.severity)}
                        ${escapeHTML(smell.type)}
                    </span>

                    <span class="severity ${smell.severity}">
                        ${smell.severity.toUpperCase()}
                    </span>

                </div>

                <p>
                    <strong>
                        ${escapeHTML(smell.table)}
                    </strong>
                    <br>
                    ${escapeHTML(smell.description)}
                </p>

                <div class="recommendation">
                    💡 ${escapeHTML(smell.recommendation)}
                </div>

            </div>

        `).join("");

}


/* =========================================================
   RECENT PROBLEMS
========================================================= */

function renderRecentProblems() {

    const container =
        document.getElementById(
            "recentProblems"
        );


    if (!database.smells.length) {

        container.innerHTML = `
            <div class="empty">
                No problems detected.
            </div>
        `;

        return;
    }


    container.innerHTML =
        database.smells
            .slice(0, 5)
            .map(smell => `

                <div class="problem">

                    <div class="problem-icon">
                        ${iconForSeverity(smell.severity)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(smell.type)}
                        </strong>

                        <span>
                            ${escapeHTML(smell.table)}
                        </span>

                    </div>

                </div>

            `)
            .join("");

}


/* =========================================================
   ER DIAGRAM
========================================================= */

function renderERDiagram() {

    const svg =
        document.getElementById("erDiagram");

    const empty =
        document.getElementById("diagramEmpty");


    if (!database.tables.length) {

        svg.innerHTML = "";

        empty.style.display = "block";

        return;
    }


    empty.style.display = "none";


    const width =
        svg.clientWidth || 1000;

    const tableWidth = 230;

    const gap = 80;

    const tableHeight = 55;


    let html = "";

    const positions = {};


    database.tables.forEach(
        (table, index) => {

            const col =
                index % 3;

            const row =
                Math.floor(index / 3);

            const x =
                40 +
                col *
                (tableWidth + gap);

            const y =
                50 +
                row * 250;


            positions[table.name] = {
                x,
                y,
                width: tableWidth,
                height:
                    tableHeight +
                    table.columns.length * 23
            };

        }
    );


    /* Relationship lines */

    database.foreignKeys.forEach(fk => {

        const childTable =
            database.tables.find(
                table =>
                    table.columns.some(
                        column =>
                            column.name === fk.column
                    )
            );

        const parentTable =
            database.tables.find(
                table =>
                    table.name.toLowerCase() ===
                    fk.referencedTable.toLowerCase()
            );


        if (!childTable || !parentTable)
            return;


        const child =
            positions[childTable.name];

        const parent =
            positions[parentTable.name];


        const x1 =
            child.x + child.width / 2;

        const y1 =
            child.y + child.height;

        const x2 =
            parent.x + parent.width / 2;

        const y2 =
            parent.y;


        html += `
            <line
                x1="${x1}"
                y1="${y1}"
                x2="${x2}"
                y2="${y2}"
                class="er-line"
            />
        `;

    });


    /* Tables */

    database.tables.forEach(table => {

        const pos =
            positions[table.name];


        html += `
            <rect
                x="${pos.x}"
                y="${pos.y}"
                width="${pos.width}"
                height="${pos.height}"
                rx="10"
                class="er-table"
            />

            <rect
                x="${pos.x}"
                y="${pos.y}"
                width="${pos.width}"
                height="42"
                rx="10"
                class="er-title"
            />

            <text
                x="${pos.x + 15}"
                y="${pos.y + 26}"
                class="er-text"
                font-weight="bold"
            >
                ${escapeHTML(table.name)}
            </text>
        `;


        table.columns.forEach(
            (column, index) => {

                html += `

                    <text
                        x="${pos.x + 15}"
                        y="${pos.y + 66 + index * 23}"
                        class="er-text"
                    >
                        ${
                            column.primaryKey
                            ? "🔑 "
                            : ""
                        }
                        ${escapeHTML(column.name)}
                    </text>

                `;

            }
        );

    });


    svg.innerHTML = html;

}


/* =========================================================
   NORMALIZATION
========================================================= */

function analyzeNormalization() {

    if (!database.tables.length) return;


    const repeating =
        database.smells.some(
            s =>
                s.type === "Repeating Group" ||
                s.type === "Multi-Valued Attribute"
        );


    const missingPK =
        database.smells.some(
            s =>
                s.type === "Missing Primary Key"
        );


    const nf1 = !repeating;

    const nf2 =
        nf1 &&
        !missingPK;

    const nf3 =
        nf2 &&
        database.foreignKeys.length >=
        Math.max(
            0,
            database.tables.length - 1
        );


    updateNF("nf1", nf1);

    updateNF("nf2", nf2);

    updateNF("nf3", nf3);

    updateNF("bcnf", nf3);


    const report =
        document.getElementById(
            "normalizationReport"
        );


    report.innerHTML = `

        <p>
            <strong>1NF:</strong>
            ${
                nf1
                ? "✓ No obvious repeating groups detected."
                : "✗ Repeating or multi-valued attributes detected."
            }
        </p>

        <p>
            <strong>2NF:</strong>
            ${
                nf2
                ? "✓ No obvious primary-key design issue detected."
                : "⚠ Review key design and possible partial dependencies."
            }
        </p>

        <p>
            <strong>3NF:</strong>
            ${
                nf3
                ? "✓ Basic structural checks passed."
                : "⚠ Review dependencies and entity relationships."
            }
        </p>

        <p>
            <strong>Note:</strong>
            This frontend analyzer provides heuristic normalization
            checks. Full formal normalization requires functional
            dependencies and candidate-key information.
        </p>

    `;

}


function updateNF(id, pass) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.classList.remove(
        "pass",
        "fail"
    );

    element.classList.add(
        pass ? "pass" : "fail"
    );

    const status =
        element.querySelector("b");

    status.textContent =
        pass ? "✓ PASS" : "⚠ REVIEW";

}


/* =========================================================
   FUNCTIONAL DEPENDENCIES
========================================================= */

function analyzeDependencies() {

    const attributes =
        document.getElementById(
            "attributesInput"
        ).value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);


    const fdText =
        document.getElementById(
            "fdInput"
        ).value.trim();


    const result =
        document.getElementById(
            "dependencyResult"
        );


    if (!attributes.length || !fdText) {

        result.innerHTML =
            `<div class="empty">
                Enter attributes and dependencies.
             </div>`;

        return;
    }


    const fds =
        parseFDs(fdText);


    let html = "";


    html += `
        <div class="dependency-result">

            <strong>
                Parsed Functional Dependencies
            </strong>

            <br><br>

            ${fds.map(fd =>
                `${fd.left.join(", ")} → ${fd.right.join(", ")}`
            ).join("<br>")}

        </div>
    `;


    /* Candidate keys */

    const keys =
        findCandidateKeys(
            attributes,
            fds
        );


    html += `
        <div class="dependency-result">

            <strong>
                Candidate Key(s)
            </strong>

            <br><br>

            ${
                keys.length
                ? keys.map(
                    key =>
                    `🔑 ${key.join(", ")}`
                  ).join("<br>")
                : "No candidate key found."
            }

        </div>
    `;


    /* Closure */

    const firstAttribute =
        attributes[0];


    const closure =
        calculateClosure(
            [firstAttribute],
            fds
        );


    html += `
        <div class="dependency-result">

            <strong>
                Closure of ${firstAttribute}
            </strong>

            <br><br>

            { ${closure.join(", ")} }

        </div>
    `;


    result.innerHTML = html;

}


/* =========================================================
   PARSE FDS
========================================================= */

function parseFDs(text) {

    return text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {

            const parts =
                line.split(/->|→/);

            if (parts.length !== 2) {

                return {
                    left: [],
                    right: []
                };

            }


            return {

                left:
                    parts[0]
                        .split(",")
                        .map(x => x.trim())
                        .filter(Boolean),

                right:
                    parts[1]
                        .split(",")
                        .map(x => x.trim())
                        .filter(Boolean)

            };

        })
        .filter(fd =>
            fd.left.length &&
            fd.right.length
        );

}


/* =========================================================
   ATTRIBUTE CLOSURE
========================================================= */

function calculateClosure(
    attributes,
    fds
) {

    const closure =
        new Set(attributes);


    let changed = true;


    while (changed) {

        changed = false;


        fds.forEach(fd => {

            const canApply =
                fd.left.every(
                    attr =>
                        closure.has(attr)
                );


            if (!canApply) return;


            fd.right.forEach(attr => {

                if (!closure.has(attr)) {

                    closure.add(attr);

                    changed = true;

                }

            });

        });

    }


    return [...closure];

}


/* =========================================================
   CANDIDATE KEYS
========================================================= */

function findCandidateKeys(
    attributes,
    fds
) {

    const keys = [];


    /* Attributes never appearing on RHS */

    const rhs =
        new Set(
            fds.flatMap(fd =>
                fd.right
            )
        );


    const mandatory =
        attributes.filter(
            attr =>
                !rhs.has(attr)
        );


    const closure =
        calculateClosure(
            mandatory,
            fds
        );


    if (
        closure.length ===
        attributes.length
    ) {

        keys.push(mandatory);

        return keys;

    }


    /* Brute force combinations */

    for (
        let size = 1;
        size <= attributes.length;
        size++
    ) {

        const combinations =
            combinationsOf(
                attributes,
                size
            );


        for (const combo of combinations) {

            const closure =
                calculateClosure(
                    combo,
                    fds
                );


            if (
                closure.length ===
                attributes.length
            ) {

                const already =
                    keys.some(
                        key =>
                            key.every(
                                x =>
                                    combo.includes(x)
                            )
                    );


                if (!already) {

                    keys.push(combo);

                }

            }

        }


        if (keys.length) break;

    }


    return keys;

}


/* =========================================================
   COMBINATIONS
========================================================= */

function combinationsOf(
    array,
    size
) {

    const result = [];


    function helper(
        start,
        current
    ) {

        if (
            current.length ===
            size
        ) {

            result.push(
                [...current]
            );

            return;

        }


        for (
            let i = start;
            i < array.length;
            i++
        ) {

            current.push(array[i]);

            helper(
                i + 1,
                current
            );

            current.pop();

        }

    }


    helper(0, []);

    return result;

}


/* =========================================================
   QUERY ADVISOR
========================================================= */

function analyzeQuery() {

    const query =
        document.getElementById(
            "queryInput"
        ).value.trim();


    const result =
        document.getElementById(
            "queryResult"
        );


    if (!query) {

        result.innerHTML =
            `<div class="empty">
                Enter a SQL query.
             </div>`;

        return;

    }


    const recommendations = [];


    if (/SELECT\s+\*/i.test(query)) {

        recommendations.push({

            title: "Avoid SELECT *",

            text:
                "Select only the columns required by the application.",

            type: "warning"

        });

    }


    if (
        /WHERE\s+\w+\s*=/i.test(query)
    ) {

        const match =
            query.match(
                /WHERE\s+(\w+)\s*=/i
            );


        if (match) {

            recommendations.push({

                title: "Consider an Index",

                text:
                    `Column "${match[1]}" is used in a WHERE condition. An index may improve lookup performance.`,

                type: "suggestion"

            });

        }

    }


    if (
        /LIKE\s+['"]%/i.test(query)
    ) {

        recommendations.push({

            title: "Leading Wildcard",

            text:
                "LIKE '%text' may prevent normal B-tree index usage.",

            type: "warning"

        });

    }


    if (
        /OR\s+/i.test(query)
    ) {

        recommendations.push({

            title: "OR Condition",

            text:
                "Review OR predicates because complex conditions may reduce index efficiency.",

            type: "suggestion"

        });

    }


    if (
        /ORDER\s+BY/i.test(query) &&
        !/LIMIT/i.test(query)
    ) {

        recommendations.push({

            title: "Large Result Set",

            text:
                "Consider LIMIT when only a small number of records are required.",

            type: "suggestion"

        });

    }


    if (!recommendations.length) {

        recommendations.push({

            title: "Basic Checks Passed",

            text:
                "No obvious problems were detected by the frontend query advisor.",

            type: "good"

        });

    }


    result.innerHTML =
        recommendations.map(item => `

            <div class="optimization-item">

                <strong>
                    ${iconForSeverity(item.type)}
                    ${escapeHTML(item.title)}
                </strong>

                <span>
                    ${escapeHTML(item.text)}
                </span>

            </div>

        `).join("");

}


/* =========================================================
   OPTIMIZATION
========================================================= */

function generateOptimization() {

    const problems =
        document.getElementById(
            "optimizationProblems"
        );

    const optimized =
        document.getElementById(
            "optimizedSchema"
        );


    if (!database.tables.length) {

        problems.innerHTML =
            "Analyze your schema first.";

        optimized.innerHTML =
            "No schema available.";

        return;

    }


    if (!database.smells.length) {

        problems.innerHTML = `
            <div class="optimization-item">
                <strong>✓ No major smells detected</strong>
                <span>
                    The schema passed the current frontend checks.
                </span>
            </div>
        `;

    } else {

        problems.innerHTML =
            database.smells.map(smell => `

                <div class="optimization-item">

                    <strong>
                        ${iconForSeverity(smell.severity)}
                        ${escapeHTML(smell.type)}
                    </strong>

                    <span>
                        ${escapeHTML(smell.recommendation)}
                    </span>

                </div>

            `).join("");

    }


    const recommendations = [];


    database.tables.forEach(table => {

        const hasPK =
            table.columns.some(
                c => c.primaryKey
            );


        if (!hasPK) {

            const idColumn =
                table.columns.find(
                    c =>
                        /(^id$|id$|_id$)/i
                            .test(c.name)
                );


            if (idColumn) {

                recommendations.push({

                    table: table.name,

                    text:
                        `Consider making ${idColumn.name} the PRIMARY KEY.`

                });

            }

        }


        const repeating =
            detectRepeatingGroups(
                table.columns
            );


        if (repeating.length) {

            recommendations.push({

                table: table.name,

                text:
                    `Move repeated fields (${repeating.join(", ")}) into a separate child table.`

            });

        }

    });


    optimized.innerHTML =
        recommendations.length

        ?

        recommendations.map(item => `

            <div class="optimization-item">

                <strong>
                    ${escapeHTML(item.table)}
                </strong>

                <span>
                    ${escapeHTML(item.text)}
                </span>

            </div>

        `).join("")

        :

        `
        <div class="optimization-item">

            <strong>✓ Schema looks healthy</strong>

            <span>
                No automatic restructuring recommendation
                was generated.
            </span>

        </div>
        `;

}


/* =========================================================
   SQL GENERATOR
========================================================= */

function generateSQL() {

    if (!database.tables.length) {

        document.getElementById(
            "generatedSQL"
        ).textContent =
            "-- Analyze a schema to generate SQL.";

        return;

    }


    let sql = "";


    database.tables.forEach(table => {

        sql +=
            `CREATE TABLE ${table.name} (\n`;


        const definitions = [];


        table.columns.forEach(column => {

            let definition =
                `    ${column.name} ${column.type}`;


            if (column.primaryKey) {

                definition +=
                    " PRIMARY KEY";

            }


            if (column.notNull) {

                definition +=
                    " NOT NULL";

            }


            if (column.unique) {

                definition +=
                    " UNIQUE";

            }


            definitions.push(
                definition
            );

        });


        sql +=
            definitions.join(",\n");


        sql +=
            "\n);\n\n";

    });


    /* Foreign keys */

    database.foreignKeys.forEach(fk => {

        const childTable =
            database.tables.find(
                table =>
                    table.columns.some(
                        column =>
                            column.name ===
                            fk.column
                    )
            );


        if (!childTable) return;


        sql +=
            `ALTER TABLE ${childTable.name}
ADD FOREIGN KEY (${fk.column})
REFERENCES ${fk.referencedTable}(${fk.referencedColumn});

\n`;

    });


    document.getElementById(
        "generatedSQL"
    ).textContent = sql;

}


/* =========================================================
   COPY SQL
========================================================= */

function copyGeneratedSQL() {

    const sql =
        document.getElementById(
            "generatedSQL"
        ).textContent;


    navigator.clipboard
        .writeText(sql)
        .then(() => {

            showToast(
                "Generated SQL copied"
            );

        });

}


/* =========================================================
   HELPERS
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


function iconForSeverity(severity) {

    if (
        severity === "critical"
    ) return "🔴";

    if (
        severity === "warning"
    ) return "🟠";

    if (
        severity === "suggestion"
    ) return "🔵";

    return "🟢";

}


function escapeRegex(text) {

    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    toast.textContent =
        message;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2500);

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSample();

        analyzeSchema();

        showSection("dashboard");

    }
);