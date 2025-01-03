<?php

namespace App\Controller;

use App\Entity\Sale;
use App\Repository\SaleRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class SaleController
{
    private $repository;

    public function __construct(SaleRepository $repository)
    {
        $this->repository = $repository;
    }

    #[Route('/sales', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $sales = $this->repository->findAll();
        return new JsonResponse(
            array_map(fn($sale) => $sale->toArray(), $sales),
            Response::HTTP_OK
        );
    }

    #[Route('/sales/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $sale = $this->repository->find($id);
        
        if (!$sale) {
            return new JsonResponse(['error' => 'Sale not found'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse($sale->toArray(), Response::HTTP_OK);
    }

    #[Route('/sales', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $sale = new Sale();
        $sale->setCustomerName($data['customer_name']);
        $sale->setAmount($data['amount']);
        
        $this->repository->save($sale);
        
        return new JsonResponse($sale->toArray(), Response::HTTP_CREATED);
    }
}