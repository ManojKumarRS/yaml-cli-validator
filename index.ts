#! /usr/bin/env node

import { program } from 'commander'
import {validateRecursively} from "./lib/validator";

program
    .command('validate <paths>')
    .option('-r, --relative')
    .description('Validate all YAMLs in given directories recursively')
    .action(validateRecursively)

program.parse()