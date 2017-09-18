import * as ts from 'typescript'

const operators = {
    [ts.SyntaxKind.EqualsToken]: 'put',
    [ts.SyntaxKind.PlusToken]: 'add',
    [ts.SyntaxKind.MinusToken]: 'subtract',
    [ts.SyntaxKind.AsteriskToken]: 'multiply',
    [ts.SyntaxKind.SlashToken]: 'divide',
    [ts.SyntaxKind.ExclamationToken]: 'not',
    [ts.SyntaxKind.PercentToken]: 'remainder',
    [ts.SyntaxKind.GreaterThanToken]: 'greater',
    [ts.SyntaxKind.GreaterThanEqualsToken]: 'greaterOrEqual',
    [ts.SyntaxKind.LessThanToken]: 'less',
    [ts.SyntaxKind.LessThanEqualsToken]: 'lessOrEqual',
    [ts.SyntaxKind.EqualsEqualsToken]: 'looseEqual',
    [ts.SyntaxKind.EqualsEqualsEqualsToken]: 'equal',
    [ts.SyntaxKind.AmpersandAmpersandToken]: 'and',
    [ts.SyntaxKind.BarBarToken]: 'or'
}
// alter the default implementation so anything can be decorated
;(ts as any).nodeCanBeDecorated = () => true

/**
 * Primarily from https://github.com/css-modules/css-modules-require-hook
 *
 * @export
 * @interface Opts
 */
export interface Opts {
    devMode?: boolean
}
interface TypeNodeWithTypeName extends ts.TypeNode {
    typeName: ts.Expression
}

interface HasReactive extends ts.Node {
    isReactive: boolean
}

function getTypeDescriptor(property: ts.PropertyDeclaration): ts.Expression {
    let type = property.type
    if (!type) {
        if (property.initializer) {
            switch (property.initializer.kind) {
                case ts.SyntaxKind.StringLiteral:
                    return ts.createLiteral('string')
                case ts.SyntaxKind.FirstLiteralToken:
                    return ts.createLiteral('number')
            }
        }
        return ts.createLiteral('any')
    }
    switch (type.kind) {
        case ts.SyntaxKind.StringKeyword:
            return ts.createLiteral('string')
        case ts.SyntaxKind.NumberKeyword:
            return ts.createLiteral('number')
        case ts.SyntaxKind.StringKeyword:
            return ts.createLiteral('boolean')
        case ts.SyntaxKind.TypeReference:
            return ts.createIdentifier((type as TypeNodeWithTypeName).typeName.getText())
        case ts.SyntaxKind.TypeLiteral:
            throw new Error('type literal, NIY')
        default:
            throw new Error('Unknown type ' + ts.SyntaxKind[type.kind])
    }
}

function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (pullDecorator('reactive', node)) {
            (node as HasReactive).isReactive = true
            return reactiveVisitor(node)
        }
        return ts.visitEachChild(node, visitor, ctx)
    }
    const reactiveVisitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (pullDecorator('direct', node)) {
            return immediateVisitor(node)
        }
        switch(node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                let classDeclaration = node as ts.ClassDeclaration
                getClassDescriptor(classDeclaration)
                break

            case ts.SyntaxKind.Block:
                if (!(node.parent as HasReactive).isReactive) {
                    return immediateVisitor(node)
                }
                break

            case ts.SyntaxKind.Decorator:
                return node // don't want to double process decorators
        }
        node = ts.visitEachChild(node, reactiveVisitor, ctx) || node

        switch(node.kind) {
            case ts.SyntaxKind.PropertyDeclaration:
                let property = node as ts.PropertyDeclaration
                let parentClass = node.parent
                if (node.parent.kind != ts.SyntaxKind.ClassDeclaration) {
                    throw new Error('Property declared in non-class')
                }
                let classDescriptor = getClassDescriptor(parentClass)
                let propertyDescriptor = ts.createPropertyAssignment(property.name, getTypeDescriptor(property))
                classDescriptor.properties.push(propertyDescriptor)
                break

            case ts.SyntaxKind.BinaryExpression:
                let binary = node as ts.BinaryExpression
                let binaryOperator = binary.operatorToken
                if (!operators[binaryOperator.kind]) {
                    console.error('Unknown binary operator ' + ts.SyntaxKind[binaryOperator.kind])
                    return binary
                }
                if (binaryOperator.kind == ts.SyntaxKind.EqualsToken) {
                    return ts.createCall(
                        ts.createPropertyAccess(
                            ts.createConditional(
                                ts.createBinary(binary.left, ts.SyntaxKind.AmpersandAmpersandToken,
                                    ts.createPropertyAccess(binary.left, 'put')),
                                binary.left,
                                ts.createBinary(binary.left, ts.SyntaxKind.EqualsToken,
                                    ts.createCall(
                                        ts.createPropertyAccess(
                                            reactiveReference, 'from'), [], []))),
                            'put'), [],
                        [binary.right])
                }
                let binaryCall = getReactiveCall(operators[binaryOperator.kind], [binary.left, binary.right])
                return binaryCall

            case ts.SyntaxKind.PrefixUnaryExpression: case ts.SyntaxKind.PostfixUnaryExpression:
                let unary = node as ts.PostfixUnaryExpression
                let unaryOperator = unary.operator
                if (!operators[unaryOperator]) {
                    console.error('Unknown unary operator ' + ts.SyntaxKind[unaryOperator])
                    return unary
                }
                return getReactiveCall(operators[unaryOperator], [unary.operand])

            case ts.SyntaxKind.CallExpression:
                let callParent = node.parent || ((node as any).original.parent as ts.Node)
                if (ts.isExpressionStatement(callParent) || ts.isForStatement(callParent))
                    break // if parent is statement, don't transform call
                let call = node as ts.CallExpression
                let target = call.expression
                if (target.kind == ts.SyntaxKind.PropertyAccessExpression) {
                    let callProperty = target as ts.PropertyAccessExpression
                    return getReactiveCall('mcall', 
                        [callProperty.expression, callProperty.name, ts.createArrayLiteral(call.arguments)])
                } else {
                    return getReactiveCall('fcall', [target, ts.createArrayLiteral(call.arguments)])
                }

            case ts.SyntaxKind.ObjectLiteralExpression: case ts.SyntaxKind.ArrayLiteralExpression:
                return getReactiveCall('obj', [node as ts.Expression])

/*            case ts.SyntaxKind.VariableDeclaration:
                return ts.createCall(
                    ts.createPropertyAccess(
                        ts.createIdentifier('reactive'),
                        ts.createIdentifier('from')),
                    [],
                    [node as ts.Expression])*/

          //  default:

        }
        statementNeedingValue(node)
        return node
    }
    const immediateVisitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (pullDecorator('reactive', node)) {
            (node as HasReactive).isReactive = true
            return reactiveVisitor(node)
        }
        switch(node.kind) {
            case ts.SyntaxKind.ConditionalExpression:
                let conditional = node as ts.ConditionalExpression
                conditional.condition = asValue(conditional.condition)
                break
            case ts.SyntaxKind.BinaryExpression:
                let binary = node as ts.BinaryExpression
                if (binary.operatorToken.kind == ts.SyntaxKind.AmpersandAmpersandToken ||
                    binary.operatorToken.kind == ts.SyntaxKind.BarBarToken) {
                    binary.left = asValue(binary.left)
                }
                break
            case ts.SyntaxKind.PrefixUnaryExpression:
                let unary = node as ts.PrefixUnaryExpression
                if (unary.operator == ts.SyntaxKind.ExclamationToken) {
                    unary.operand = asValue(unary.operand)
                }
                break
        }
        statementNeedingValue(node)
        return ts.visitEachChild(node, immediateVisitor, ctx)
    }

    function statementNeedingValue(node: ts.Node) {
        // statements that need booleans, use the valueOf() coercion
        switch(node.kind) {
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.ForInStatement:
                let statement = node as ts.IfStatement
                statement.expression = asValue(statement.expression)
                break
            case ts.SyntaxKind.ForStatement:
                let forStatement = node as ts.ForStatement
                forStatement.condition = asValue(forStatement.condition)
                break
        }
    }

    function asValue(expression) {
        // boolean coercion won't delegate to valueOf(), so we need to manually do a valueOf()
        // for boolean accepting operands
        if (ts.isLiteralExpression(expression)) {
            return expression
        }
        return getReactiveCall('val', [expression])
    }

    let reactiveReference
    const pullDecorator = (name: string, node: ts.Node) =>
        node.decorators && node.decorators.some((decorator, i) => {
            if (decorator.expression.getText(sf) === name) {
                let visitedDecorator = ts.visitEachChild(decorator, visitor, ctx)
                if (name === 'reactive') {
                    reactiveReference = visitedDecorator.expression
                }
                node.decorators.splice(i, 1)
                if (node.decorators.length == 0)
                    node.decorators = undefined
                return true
            }
        })

    function getReactiveCall(name, args) {
        return ts.createCall(
            ts.createPropertyAccess(
                reactiveReference,
                ts.createIdentifier(name)),
            [],
            args)
    }


    function getClassDescriptor(parentClass: ts.Node): ts.ObjectLiteralExpression {
        if (!parentClass.decorators) {
            parentClass.decorators = ts.createNodeArray()
        }

        for (let decorator of parentClass.decorators) {
            if (decorator.expression.kind == ts.SyntaxKind.CallExpression) {
                let call = decorator.expression as ts.CallExpression
                if (call.expression.kind == ts.SyntaxKind.PropertyAccessExpression) {
                    let propertyAccess = call.expression as ts.PropertyAccessExpression
                    if (propertyAccess.name.text === 'cls') {
                        for (let arg of call.arguments) {
                            return arg as ts.ObjectLiteralExpression
                        }
                    }
                }
            }
        }

        let classDescriptor: ts.ObjectLiteralExpression
        parentClass.decorators.push(
            ts.createDecorator(
                ts.createCall(
                    ts.createPropertyAccess(
                        reactiveReference,
                        ts.createIdentifier('cls')),
                    [],
                    [classDescriptor = ts.createObjectLiteral([])])))
        return classDescriptor

    }

    return visitor
}

export default function(/*opts?: Opts*/) {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf))
    }
}
