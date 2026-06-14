#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "../../..");

const resourcesPath = path.join(webRoot, "src/data/resources.ts");
const seedPaths = [
  path.join(repoRoot, "backend/db/migrate/migrations/003_seed_core_data.up.sql"),
  path.join(repoRoot, "backend/db/init.sql"),
];

const CATEGORY_TO_BACKEND = {
  intelligence: { subType: "think_tank", label: "智库" },
  surface: { subType: "campus", label: "校园" },
  armory: { subType: "tools", label: "工具" },
};

const CHECKED_COLUMNS = [
  "content_type",
  "sub_type",
  "icon",
  "title",
  "description",
  "content",
  "sort",
  "active",
  "category",
  "cover_url",
  "link_url",
];

function readDefaultResourceCategories() {
  const sourceText = fs.readFileSync(resourcesPath, "utf8");
  const sourceFile = ts.createSourceFile(resourcesPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let initializer = null;
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (declaration.name.getText(sourceFile) === "DEFAULT_RESOURCE_CATEGORIES") {
        initializer = declaration.initializer;
      }
    }
  });

  if (!initializer) {
    throw new Error(`DEFAULT_RESOURCE_CATEGORIES was not found in ${resourcesPath}`);
  }

  return parseTsLiteral(initializer, sourceFile);
}

function parseTsLiteral(node, sourceFile) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => parseTsLiteral(element, sourceFile));
  }
  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key = propertyNameToString(property.name, sourceFile);
      value[key] = parseTsLiteral(property.initializer, sourceFile);
    }
    return value;
  }
  throw new Error(`Unsupported literal in ${resourcesPath}: ${node.getText(sourceFile)}`);
}

function propertyNameToString(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return name.getText(sourceFile);
}

function expectedRowsFromFrontend() {
  const categories = readDefaultResourceCategories();
  return categories.flatMap((category) => {
    const backend = CATEGORY_TO_BACKEND[category.id];
    if (!backend) {
      throw new Error(`No backend mapping is defined for resource category '${category.id}'`);
    }
    if (!Array.isArray(category.links)) {
      throw new Error(`Resource category '${category.id}' does not define a links array`);
    }

    return category.links.map((link, index) => ({
      content_type: "resource_matrix",
      sub_type: backend.subType,
      icon: category.icon,
      title: link.title,
      description: link.desc,
      content: link.desc,
      sort: index + 1,
      active: 1,
      category: "resource_matrix",
      cover_url: "",
      link_url: link.url,
    }));
  });
}

function parseNavItemsRows(sqlPath) {
  const sql = fs.readFileSync(sqlPath, "utf8");
  const insertMatch = sql.match(/INSERT INTO\s+nav_items\s*\(([^)]+)\)\s+VALUES\s*([\s\S]*?)\nON DUPLICATE KEY UPDATE/i);
  if (!insertMatch) {
    throw new Error(`No nav_items seed INSERT found in ${sqlPath}`);
  }

  const columns = insertMatch[1].split(",").map((column) => column.trim().replace(/`/g, ""));
  return parseSqlTuples(insertMatch[2]).map((values) => {
    const row = {};
    columns.forEach((column, index) => {
      row[column] = values[index];
    });
    return row;
  });
}

function parseSqlTuples(valuesBlock) {
  const tuples = [];
  let index = 0;

  while (index < valuesBlock.length) {
    if (valuesBlock[index] !== "(") {
      index += 1;
      continue;
    }

    let depth = 1;
    let inString = false;
    let tuple = "";
    index += 1;

    while (index < valuesBlock.length && depth > 0) {
      const char = valuesBlock[index];
      const next = valuesBlock[index + 1];

      if (inString) {
        tuple += char;
        if (char === "'" && next === "'") {
          tuple += next;
          index += 2;
          continue;
        }
        if (char === "'") inString = false;
        index += 1;
        continue;
      }

      if (char === "'") {
        inString = true;
        tuple += char;
      } else if (char === "(") {
        depth += 1;
        tuple += char;
      } else if (char === ")") {
        depth -= 1;
        if (depth > 0) tuple += char;
      } else {
        tuple += char;
      }
      index += 1;
    }

    tuples.push(parseSqlTupleValues(tuple));
  }

  return tuples;
}

function parseSqlTupleValues(tuple) {
  const values = [];
  let current = "";
  let quoted = false;
  let inString = false;

  const pushValue = () => {
    values.push(normalizeSqlValue(current, quoted));
    current = "";
    quoted = false;
  };

  for (let index = 0; index < tuple.length; index += 1) {
    const char = tuple[index];
    const next = tuple[index + 1];

    if (inString) {
      if (char === "'" && next === "'") {
        current += "'";
        index += 1;
        continue;
      }
      if (char === "'") {
        inString = false;
        continue;
      }
      current += char;
      continue;
    }

    if (char === "'") {
      if (current.trim() === "") current = "";
      quoted = true;
      inString = true;
      continue;
    }

    if (char === ",") {
      pushValue();
      continue;
    }

    current += char;
  }

  pushValue();
  return values;
}

function normalizeSqlValue(rawValue, quoted) {
  if (quoted) return rawValue;
  const value = rawValue.trim();
  if (/^null$/i.test(value)) return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

function resourceRowsFromSeed(sqlPath) {
  return parseNavItemsRows(sqlPath)
    .filter((row) => row.content_type === "resource_matrix")
    .map((row) => {
      const normalized = {};
      CHECKED_COLUMNS.forEach((column) => {
        normalized[column] = row[column];
      });
      return normalized;
    });
}

function sortRows(rows) {
  const subTypeOrder = new Map([
    ["think_tank", 0],
    ["campus", 1],
    ["tools", 2],
  ]);
  return [...rows].sort((a, b) => {
    const orderA = subTypeOrder.get(a.sub_type) ?? 99;
    const orderB = subTypeOrder.get(b.sub_type) ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.sort - b.sort;
  });
}

function compareRows(expectedRows, actualRows, label) {
  const expected = sortRows(expectedRows);
  const actual = sortRows(actualRows);
  const failures = [];

  if (expected.length !== actual.length) {
    failures.push(`expected ${expected.length} resource_matrix rows but found ${actual.length}`);
  }

  const maxLength = Math.max(expected.length, actual.length);
  for (let index = 0; index < maxLength; index += 1) {
    const expectedRow = expected[index];
    const actualRow = actual[index];
    if (!expectedRow || !actualRow) continue;

    for (const column of CHECKED_COLUMNS) {
      if (expectedRow[column] !== actualRow[column]) {
        failures.push(
          `row ${index + 1} (${expectedRow.sub_type}/${expectedRow.sort}) column '${column}': expected ${JSON.stringify(
            expectedRow[column],
          )}, got ${JSON.stringify(actualRow[column])}`,
        );
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`${label} does not match frontend resources.ts:\n- ${failures.join("\n- ")}`);
  }
}

function main() {
  const expectedRows = expectedRowsFromFrontend();
  for (const seedPath of seedPaths) {
    compareRows(expectedRows, resourceRowsFromSeed(seedPath), path.relative(repoRoot, seedPath));
  }

  console.log(
    `OK: frontend resource mock data matches backend resource_matrix seeds in ${seedPaths.length} SQL files (${expectedRows.length} rows).`,
  );
}

main();
