Cypress.on('uncaught:exception', (err, runnable) => {
  // Esto evita que Cypress falle por errores de JS de la aplicación
  return false;
});

describe("Filtrar por marca Apple", () => {
    it("Gets, types e asserts", () => {
        cy.visit("http://localhost:7050")
        cy.get('#filterDropdown').click();
        cy.get('a[data-brand="Apple"]').contains('Apple').click();
        ;}
    );
});

describe("Hacer click en gestión", () => {
    it("Gets, types e asserts", () => {
        cy.visit("http://localhost:7050")
        cy.get('a[href="/gestion"]').click();
        ;}
    );
});


describe("Agregar cliente", () => {
    it("Gets, types e asserts", () => {
        cy.visit("http://localhost:7050")
        cy.get('a[href="/gestion"]').click();
        cy.get('#cliente-nombre').type('Franco')
        cy.get('#cliente-apellido').type('Rivera')
        cy.get('#cliente-dni').type('2934848')
        cy.get('button').contains('Agregar Cliente').click()
        ;}
    );
});


describe("Agregar venta", () => {
    it("Gets, types e asserts", () => {
        cy.visit("http://localhost:7050/gestion")
        cy.get('button').contains('Ventas').click()
        cy.get('#venta-cliente-input').type('5948583')
        cy.get('#venta-producto-id').select('1')
        cy.get('#venta-fecha').type('2025-06-01T08:30')
        cy.get('button').contains('Registrar Venta').click()
        ;}
    );
});


describe("Agregar celular", () => {
    it("Gets, types e asserts", () => {
        cy.visit("http://localhost:7050/gestion")
        cy.get('#celulares-crud-tab').click()
        cy.get('#add-marca', { timeout: 100000 }).should('be.visible').type('Xiaomi');
        cy.get('#add-modelo').type('Redmi Note 15')
        cy.get('#add-precio').type('300')
        cy.get('#add-peso').type('200g')
        cy.get('#add-ram').type('12GB')
        cy.get('#add-camara_frontal').type('12MP')
        cy.get('#add-camara_trasera').type('48MP')
        cy.get('#add-procesador').type('MediaTek Dimensity 9000')
        cy.get('#add-capacidad_bateria').type('5000mAh')
        cy.get('#add-tamanio_pantalla').type('6.7 inches')
        cy.get('#add-lanzamiento').type('2025-12-31')
        cy.get('button').contains('Agregar Celular').click()
        ;}
    );
});
