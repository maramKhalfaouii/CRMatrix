<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Matcher\UrlMatcher;
use Symfony\Component\Routing\RouteCollection;
use Symfony\Component\Routing\Route;
use App\Controller\SaleController;
use App\Repository\SaleRepository;

$routes = new RouteCollection();
$repository = new SaleRepository();
$controller = new SaleController($repository);

$routes->add('sales_index', new Route(
    '/sales',
    ['_controller' => [$controller, 'index']],
    [],
    [],
    '',
    [],
    ['GET']
));

$routes->add('sales_create', new Route(
    '/sales',
    ['_controller' => [$controller, 'create']],
    [],
    [],
    '',
    [],
    ['POST']
));

$routes->add('sales_show', new Route(
    '/sales/{id}',
    ['_controller' => [$controller, 'show']],
    ['id' => '\d+'],
    [],
    '',
    [],
    ['GET']
));

$context = new RequestContext();
$request = Request::createFromGlobals();
$context->fromRequest($request);

$matcher = new UrlMatcher($routes, $context);
try {
    $parameters = $matcher->match($request->getPathInfo());
    $response = call_user_func($parameters['_controller'], ...array_filter($parameters, fn($key) => $key !== '_controller', ARRAY_FILTER_USE_KEY));
} catch (\Exception $e) {
    $response = new JsonResponse(['error' => 'Not found'], 404);
}

$response->send();