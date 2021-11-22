#! /usr/bin/env node

import { program } from 'commander'
import {validateRecursively} from "./lib/validator";
import {formatRecursively} from "./lib/formatter";

program
    .command('validate <paths>')
    .option('-r, --relative')
    .description('Validate all YAMLs in given directories recursively')
    .action(validateRecursively)

program
    .command('format <paths>')
    .option('-r, --relative')
    .description('Format all YAMLs in given directories recursively')
    .action(formatRecursively)

program.parse()