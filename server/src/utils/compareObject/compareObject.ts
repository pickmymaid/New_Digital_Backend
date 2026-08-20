/**
 * Compare two objects deeply and return changed fields.
 * @param {Object} oldObj - The old data.
 * @param {Object} newObj - The new data.
 * @returns {Object} - Object containing changed fields.
 */
export const compareObjects = (oldObj: any, newObj: any) => {
    const changes: any = {};
    console.log(newObj, 'this is new Object')
    Object.keys(newObj).forEach((key) => {
      if (typeof newObj[key] === "object" && newObj[key] !== null) {
        if (Array.isArray(newObj[key])) {
          if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            changes[key] = { old: oldObj[key], new: newObj[key] };
          }
        } else {
          const nestedChanges = compareObjects(oldObj[key] || {}, newObj[key]);
          if (Object.keys(nestedChanges).length > 0) {
            changes[key] = nestedChanges;
          }
        }
      } else if (oldObj[key] !== newObj[key]) {
        changes[key] = { old: oldObj[key], new: newObj[key] };
      }
    });
  
    return changes;
  };