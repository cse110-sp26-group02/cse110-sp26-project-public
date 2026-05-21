import assert from 'assert';
import * as vscode from 'vscode';

suite(
  'AIT Sidebar Extension Tests',
  () =>
  {

    test(
      'Extension command should be registered and executable',
      async () =>
      {

        const extension = vscode.extensions.getExtension(
          'team-02.cse110-sp26-project'
        );

        assert.ok(
          extension,
          'Extension was not found.'
        );

        await extension.activate();

        assert.strictEqual(
          extension.isActive,
          true,
          'Extension did not activate.'
        );

        const commands = await vscode.commands.getCommands(
          true
        );

        console.log(
          'AIT-related commands:',
          commands.filter(
            (
              command
            ) => command.includes(
              'ait'
            ) || command.includes(
              'AIT'
            )
          )
        );

        assert.ok(
          commands.includes(
            'aitSidebar.ping'
          ),
          'aitSidebar.ping command was not registered after activation.'
        );

        const result = await vscode.commands.executeCommand(
          'aitSidebar.ping'
        );

        assert.strictEqual(
          result,
          'AIT command is working'
        );

      }
    );

    test(
      'Extension should be discoverable by ID',
      () =>
      {

        const extension = vscode.extensions.getExtension(
          'team-02.cse110-sp26-project'
        );

        assert.ok(
          extension
        );

      }
    );

  }
);
