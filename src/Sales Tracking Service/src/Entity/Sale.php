<?php
namespace App\Entity;

class Sale {
    private $id;
    private $customer_name;
    private $amount;

    public function getId(): ?int {
        return $this->id;
    }

    public function setId(int $id): self {
        $this->id = $id;
        return $this;
    }

    public function getCustomerName(): string {
        return $this->customer_name;
    }

    public function setCustomerName(string $name): self {
        $this->customer_name = $name;
        return $this;
    }

    public function getAmount(): float {
        return $this->amount;
    }

    public function setAmount(float $amount): self {
        $this->amount = $amount;
        return $this;
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'amount' => $this->amount
        ];
    }
}