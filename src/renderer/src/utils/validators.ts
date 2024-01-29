export const validateUrlPattern = new RegExp(
  '^(https?:\\/\\/)?' +
    '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+' +
    '[a-zA-Z]{2,}|localhost)' +
    '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+&:]*)*' +
    '(\\?[;&a-zA-Z\\d%_.~+=-]*)?' +
    '(\\#[-a-zA-Z\\d_]*)?$',
  'i'
)
