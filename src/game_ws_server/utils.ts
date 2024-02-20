export function getId() {
  let id = 0;
  return function () {
    return ++id;
  };
}
