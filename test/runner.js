import assert from 'assert';
import { run } from '../src/runner.js';
import { openSync } from 'fs';

describe('Runner', () => {
  var stdout;
  var mockStdout = {
    write: text => {
      stdout = stdout + text;
    },
  };

  var stderr;
  var mockStderr = {
    write: text => {
      stderr = stderr + text;
    },
  };

  beforeEach(() => {
    stdout = '';
    stderr = '';
  });

  const fixturePath = `${__dirname}/fixtures/schema.graphql`;
  const mockStdin = { fd: openSync(fixturePath, 'r') };

  describe('run', () => {
    it('returns exit code 2 when schema is invalid', () => {
      const argv = [
        'node',
        'lib/cli.js',
        `${__dirname}/fixtures/invalid.graphql`,
      ];

      const exitCode = run(mockStdout, mockStdin, mockStderr, argv);
      assert.equal(2, exitCode);
    });

    it('returns exit code 1 when there are errors', () => {
      const argv = [
        'node',
        'lib/cli.js',
        '--rules',
        'fields-have-descriptions',
        fixturePath,
      ];

      const exitCode = run(mockStdout, mockStdin, mockStderr, argv);
      assert.equal(1, exitCode);
    });

    it('returns exit code 0 when there are errors', () => {
      const argv = [
        'node',
        'lib/cli.js',
        '--rules',
        'fields-have-descriptions',
        `${__dirname}/fixtures/valid.graphql`,
      ];

      const exitCode = run(mockStdout, mockStdin, mockStderr, argv);
      assert.equal(0, exitCode);
    });

    it('validates a single schema file and outputs in json', () => {
      const argv = [
        'node',
        'lib/cli.js',
        '--format',
        'json',
        '--rules',
        'fields-have-descriptions',
        fixturePath,
      ];

      run(mockStdout, mockStdin, mockStderr, argv);

      var errors = JSON.parse(stdout)['errors'];
      assert(errors);
      assert.equal(1, errors.length);
    });

    it('validates schema passed in via stdin and outputs in json', () => {
      const argv = [
        'node',
        'lib/cli.js',
        '--format',
        'json',
        '--rules',
        'fields-have-descriptions',
        '--stdin',
      ];

      run(mockStdout, mockStdin, mockStderr, argv);

      var errors = JSON.parse(stdout)['errors'];
      assert(errors);
      assert.equal(1, errors.length);
    });

    it('validates a schema composed of multiple files (glob) and outputs in json', () => {
      const argv = [
        'node',
        'lib/cli.js',
        '--format',
        'json',
        '--rules',
        'fields-have-descriptions',
        `${__dirname}/fixtures/schema/*.graphql`,
      ];

      run(mockStdout, mockStdin, mockStderr, argv);

      var errors = JSON.parse(stdout)['errors'];
      assert(errors);
      assert.equal(6, errors.length);
    });

    it('validates a schema composed of multiple files (args) and outputs in json', () => {
      const argv = [
        'node',
        'lib/cli.js',
        '--format',
        'json',
        '--rules',
        'fields-have-descriptions',
        `${__dirname}/fixtures/schema/schema.graphql`,
        `${__dirname}/fixtures/schema/user.graphql`,
      ];

      run(mockStdout, mockStdin, mockStderr, argv);

      var errors = JSON.parse(stdout)['errors'];
      assert(errors);
      assert.equal(4, errors.length);
    });

    it('preserves original line numbers when schema is composed of multiple files', () => {
      const argv = [
        'node',
        'lib/cli.js',
        '--format',
        'json',
        '--rules',
        'fields-have-descriptions',
        `${__dirname}/fixtures/schema/schema.graphql`,
        `${__dirname}/fixtures/schema/user.graphql`,
        `${__dirname}/fixtures/schema/comment.graphql`,
      ];

      run(mockStdout, mockStdin, mockStderr, argv);

      var errors = JSON.parse(stdout)['errors'];
      assert(errors);

      assert.equal(6, errors.length);

      assert.equal(
        'The field `Query.something` is missing a description.',
        errors[0].message
      );
      assert.equal(2, errors[0].location.line);
      assert.equal(
        `${__dirname}/fixtures/schema/schema.graphql`,
        errors[0].location.file
      );

      assert.equal(
        'The field `User.username` is missing a description.',
        errors[1].message
      );
      assert.equal(2, errors[1].location.line);
      assert.equal(
        `${__dirname}/fixtures/schema/user.graphql`,
        errors[1].location.file
      );

      assert.equal(
        'The field `User.email` is missing a description.',
        errors[2].message
      );
      assert.equal(3, errors[2].location.line);
      assert.equal(
        `${__dirname}/fixtures/schema/user.graphql`,
        errors[2].location.file
      );

      assert.equal(
        'The field `Query.viewer` is missing a description.',
        errors[3].message
      );
      assert.equal(7, errors[3].location.line);
      assert.equal(
        `${__dirname}/fixtures/schema/user.graphql`,
        errors[3].location.file
      );

      assert.equal(
        'The field `Comment.body` is missing a description.',
        errors[4].message
      );
      assert.equal(2, errors[4].location.line);
      assert.equal(
        `${__dirname}/fixtures/schema/comment.graphql`,
        errors[4].location.file
      );

      assert.equal(
        'The field `Comment.author` is missing a description.',
        errors[5].message
      );
      assert.equal(3, errors[5].location.line);
      assert.equal(
        `${__dirname}/fixtures/schema/comment.graphql`,
        errors[5].location.file
      );
    });
  });
});
