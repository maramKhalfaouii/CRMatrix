<?php
namespace App\Controller;

use App\Entity\Sale;
use App\Repository\SaleRepository;

class SaleController {
    private SaleRepository $repository;

    public function __construct(SaleRepository $repository) {
        $this->repository = $repository;
    }

    public function index(): array {
        return $this->repository->findAll();
    }

    public function show(int $id): ?Sale {
        return $this->repository->find($id);
    }

    public function create(array $data): void {
        $sale = new Sale();
        $sale->setCustomerName($data['customer_name']);
        $sale->setAmount($data['amount']);
        $sale->setStatus('new');
        $this->repository->save($sale);
    }
}
