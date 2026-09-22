-- Full reset: drops the entire database rather than individual tables, so
-- this works no matter what state the schema is in (missing tables,
-- leftover FKs, tables not listed here, etc.) and is safe to re-run even if
-- it doesn't exist. Pair with setup.sql to get back to a clean start.
DROP DATABASE IF EXISTS `nodelogin`;
