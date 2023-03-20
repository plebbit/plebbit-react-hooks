declare const deleteDatabases: () => Promise<[void, void, any, any, any]>;
declare const deleteCaches: () => Promise<[any, any, any]>;
declare const debugUtils: {
    deleteDatabases: () => Promise<[void, void, any, any, any]>;
    deleteCaches: () => Promise<[any, any, any]>;
};
export { deleteDatabases, deleteCaches };
export default debugUtils;
