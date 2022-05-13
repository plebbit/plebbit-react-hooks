declare const deleteDatabases: () => Promise<[void, void, any, any, any]>;
declare const deleteCaches: () => Promise<[any, any, any]>;
declare const deleteAccountsDatabases: () => Promise<[void, void]>;
declare const deleteNonAccountsDatabases: () => Promise<[any, any, any]>;
declare const debugUtils: {
    deleteDatabases: () => Promise<[void, void, any, any, any]>;
    deleteCaches: () => Promise<[any, any, any]>;
    deleteAccountsDatabases: () => Promise<[void, void]>;
    deleteNonAccountsDatabases: () => Promise<[any, any, any]>;
};
export { deleteDatabases, deleteCaches, deleteAccountsDatabases, deleteNonAccountsDatabases };
export default debugUtils;
