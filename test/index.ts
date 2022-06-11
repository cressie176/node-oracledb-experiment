import { EOL } from 'os';
import { Harness, SpecReporter } from 'zunit';
import suite from './suite.test';

const interactive = String(process.env.CI).toLowerCase() !== 'true';
const reporter = new SpecReporter({ colours: interactive });

const harness = new Harness(suite);
harness.run(reporter).then((report) => {
  if (report.failed) process.exit(1);
  if (report.incomplete) {
    console.log(`One or more tests were not run!${EOL}`);
    process.exit(2);
  }
});
