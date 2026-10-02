export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidMoneyError extends DomainError {}

export class InvalidRecipeError extends DomainError {}

export class InvalidMenuError extends DomainError {}

export class InvalidInventoryError extends DomainError {}

export class InvalidCustomerFlowError extends DomainError {}

export class UnknownIngredientError extends DomainError {
  constructor(ingredient: string) {
    super(`Unknown ingredient: ${ingredient}`);
  }
}

export class UnknownDrinkError extends DomainError {
  constructor(drink: string) {
    super(`Unknown drink: ${drink}`);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(ingredient: string, requested: number, available: number) {
    super(`Insufficient stock of ${ingredient}: ${requested} requested, ${available} available`);
  }
}
