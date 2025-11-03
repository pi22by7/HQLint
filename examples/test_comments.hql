-- This comment has lowercase select keyword
SELECT * FROM table1; -- inline comment with from keyword

/* Multi-line comment
   with select and where keywords
   that should be ignored */
SELECT id, name FROM users WHERE active = 1;
