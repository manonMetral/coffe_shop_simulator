import { RelativePath } from 'arch-unit-ts/dist/arch-unit/core/domain/RelativePath.js';
import { TypeScriptProject } from 'arch-unit-ts/dist/arch-unit/core/domain/TypeScriptProject.js';
import { Architectures } from 'arch-unit-ts/dist/arch-unit/library/Architectures.js';
import { classes, noClasses } from 'arch-unit-ts/dist/main.js';
import { describe, it } from 'vitest';
import { BusinessContext } from '../src/BusinessContext.js';

describe('HexagonalArchTest', () => {
  const srcProject = new TypeScriptProject(RelativePath.of('src'));

  const businessContexts = srcProject
    .filterClasses('**/package-info.ts')
    .filter((packageInfo) => packageInfo.hasImport(BusinessContext.name))
    .map((packageInfo) => packageInfo.packagePath.getDotsPath());

  function otherBusinessContextsDomains(context: string): string[] {
    return businessContexts.filter((other) => other !== context).map((name) => `${name}.domain..`);
  }

  it('has at least one business context', () => {
    if (businessContexts.length === 0) {
      throw new Error('No business context found: add a package-info.ts extending BusinessContext');
    }
  });

  describe('BoundedContexts', () => {
    it.each(businessContexts)(
      '%s should not depend on other bounded context domains',
      (context) => {
        const others = otherBusinessContextsDomains(context);
        if (others.length === 0) return;

        noClasses()
          .that()
          .resideInAnyPackage(`${context}..`)
          .should()
          .dependOnClassesThat()
          .resideInAnyPackage(...others)
          .because('Contexts can only depend on classes in the same context')
          .check(srcProject.allClasses());
      },
    );
  });

  describe('Domain', () => {
    it('should not depend on outside', () => {
      classes()
        .that()
        .resideInAPackage('..domain..')
        .should()
        .onlyDependOnClassesThat()
        .resideInAnyPackage('..domain..')
        .because('Domain model should only depend on domains')
        .check(srcProject.allClasses());
    });

    it.each(businessContexts)('should be an hexagonal architecture in context %s', (context) => {
      Architectures.layeredArchitecture()
        .consideringOnlyDependenciesInAnyPackage(`${context}..`)
        .withOptionalLayers(true)
        .layer('domain', `${context}.domain..`)
        .layer('application services', `${context}.application..`)
        .layer('primary adapters', `${context}.infrastructure.primary..`)
        .layer('secondary adapters', `${context}.infrastructure.secondary..`)
        .whereLayer('application services')
        .mayOnlyBeAccessedByLayers('primary adapters')
        .whereLayer('primary adapters')
        .mayNotBeAccessedByAnyLayer()
        .whereLayer('secondary adapters')
        .mayNotBeAccessedByAnyLayer()
        .because('Each bounded context should implement an hexagonal architecture')
        .check(srcProject.allClasses());
    });
  });

  describe('Application', () => {
    it('should not depend on infrastructure', () => {
      noClasses()
        .that()
        .resideInAPackage('..application..')
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage('..infrastructure..')
        .because('Application should only depend on domain, not on infrastructure')
        .check(srcProject.allClasses());
    });
  });

  describe('Infrastructure', () => {
    it('primary should not depend on secondary', () => {
      noClasses()
        .that()
        .resideInAPackage('..primary..')
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage('..secondary..')
        .because('Primary should not interact with secondary')
        .check(srcProject.allClasses());
    });

    it('secondary should not depend on application', () => {
      noClasses()
        .that()
        .resideInAPackage('..infrastructure.secondary..')
        .should()
        .dependOnClassesThat()
        .resideInAPackage('..application..')
        .because('Secondary should not depend on application')
        .check(srcProject.allClasses());
    });
  });
});
