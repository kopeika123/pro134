/** @type {import('turbo').Config} */
module.exports = {
  pipeline: {
    'start:dev': {
      dependsOn: [],
      outputs: []
    },
    build: {
      dependsOn: ['^build'],
      outputs: ['dist/**']
    }
  }
};
